/**
 * ARB 文件管理器
 * 负责 ARB 文件的读取、解析、修改和保存
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ArbFile, ArbEntry, ArbPlaceholder, ArbFileChangeEvent, ProjectConfig } from '../types';

export class ArbManager {
  private static instance: ArbManager;
  private arbFiles = new Map<string, ArbFile>();
  private fileWatchers: vscode.FileSystemWatcher[] = [];
  private changeEmitter = new vscode.EventEmitter<ArbFileChangeEvent>();
  
  public readonly onFileChanged = this.changeEmitter.event;

  private constructor() {}

  public static getInstance(): ArbManager {
    if (!ArbManager.instance) {
      ArbManager.instance = new ArbManager();
    }
    return ArbManager.instance;
  }

  /**
   * 初始化 ARB 管理器
   */
  public async initialize(projectConfig: ProjectConfig): Promise<void> {
    try {
      // 清理现有的监听器
      this.dispose();
      
      // 加载所有 ARB 文件
      await this.loadArbFiles(projectConfig);
      
      // 设置文件监听器
      this.setupFileWatchers(projectConfig.arbDirectory);
      
      console.log(`Loaded ${this.arbFiles.size} ARB files`);
    } catch (error) {
      console.error('Failed to initialize ARB manager:', error);
      throw error;
    }
  }

  /**
   * 加载所有 ARB 文件
   */
  public async loadArbFiles(projectConfig: ProjectConfig): Promise<void> {
    try {
      const files = await fs.readdir(projectConfig.arbDirectory);
      const arbFiles = files.filter(file => file.endsWith('.arb'));
      
      for (const fileName of arbFiles) {
        const filePath = path.join(projectConfig.arbDirectory, fileName);
        await this.loadArbFile(filePath, projectConfig.templateArbFile === fileName);
      }
    } catch (error) {
      console.error('Failed to load ARB files:', error);
    }
  }

  /**
   * 加载单个 ARB 文件
   */
  private async loadArbFile(filePath: string, isTemplate: boolean = false): Promise<ArbFile | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      // 解析 JSON 内容
      const jsonData = JSON.parse(content);
      
      // 提取语言代码
      const fileName = path.basename(filePath, '.arb');
      const localeMatch = fileName.match(/app_([a-z]{2}(?:_[A-Z]{2})?)$/);
      const locale = localeMatch ? localeMatch[1] : fileName.replace('app_', '') || 'en';
      
      // 解析条目
      const entries = new Map<string, ArbEntry>();
      
      for (const [key, value] of Object.entries(jsonData)) {
        if (key.startsWith('@@')) {
          // 跳过元数据键
          continue;
        }
        
        if (key.startsWith('@')) {
          // 处理元数据
          const originalKey = key.substring(1);
          if (entries.has(originalKey)) {
            const entry = entries.get(originalKey)!;
            const metadata = value as any;
            entry.description = metadata.description;
            entry.placeholders = metadata.placeholders;
            entry.metadata = metadata;
          }
        } else {
          // 处理翻译条目
          const entry: ArbEntry = {
            key,
            value: String(value)
          };
          entries.set(key, entry);
        }
      }
      
      const arbFile: ArbFile = {
        locale,
        filePath,
        entries,
        lastModified: stats.mtime.getTime(),
        isTemplate,
        encoding: 'utf-8'
      };
      
      this.arbFiles.set(locale, arbFile);
      return arbFile;
    } catch (error) {
      console.error(`Failed to load ARB file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 获取所有 ARB 文件
   */
  public getArbFiles(): Map<string, ArbFile> {
    return new Map(this.arbFiles);
  }

  /**
   * 获取指定语言的 ARB 文件
   */
  public getArbFile(locale: string): ArbFile | undefined {
    return this.arbFiles.get(locale);
  }

  /**
   * 获取翻译
   */
  public getTranslation(key: string, locale: string): string | undefined {
    const arbFile = this.arbFiles.get(locale);
    return arbFile?.entries.get(key)?.value;
  }

  /**
   * 获取所有语言的翻译
   */
  public getAllTranslations(key: string): Map<string, string> {
    const translations = new Map<string, string>();
    
    for (const [locale, arbFile] of this.arbFiles) {
      const entry = arbFile.entries.get(key);
      if (entry) {
        translations.set(locale, entry.value);
      }
    }
    
    return translations;
  }

  /**
   * 设置翻译
   */
  public async setTranslation(key: string, locale: string, value: string, description?: string): Promise<boolean> {
    try {
      const arbFile = this.arbFiles.get(locale);
      if (!arbFile) {
        console.error(`ARB file for locale ${locale} not found`);
        return false;
      }
      
      // 更新内存中的条目
      const entry: ArbEntry = {
        key,
        value,
        description
      };
      arbFile.entries.set(key, entry);
      
      // 保存到文件
      await this.saveArbFile(arbFile);
      
      // 触发变更事件
      this.changeEmitter.fire({
        filePath: arbFile.filePath,
        changeType: 'modified',
        timestamp: Date.now(),
        affectedKeys: [key]
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to set translation for ${key} in ${locale}:`, error);
      return false;
    }
  }

  /**
   * 批量设置翻译
   */
  public async setTranslations(key: string, translations: Map<string, string>, description?: string): Promise<boolean> {
    try {
      const promises: Promise<boolean>[] = [];
      
      for (const [locale, value] of translations) {
        promises.push(this.setTranslation(key, locale, value, description));
      }
      
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error(`Failed to set translations for ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除翻译键
   */
  public async deleteTranslation(localeOrKey: string, key?: string): Promise<boolean> {
    try {
      const affectedFiles: string[] = [];
      
      if (key) {
        // 删除特定语言的特定键
        const locale = localeOrKey;
        const arbFile = this.arbFiles.get(locale);
        if (arbFile && arbFile.entries.has(key)) {
          arbFile.entries.delete(key);
          await this.saveArbFile(arbFile);
          affectedFiles.push(arbFile.filePath);
        }
      } else {
        // 删除所有语言的特定键
        const keyToDelete = localeOrKey;
        for (const [locale, arbFile] of this.arbFiles) {
          if (arbFile.entries.has(keyToDelete)) {
            arbFile.entries.delete(keyToDelete);
            await this.saveArbFile(arbFile);
            affectedFiles.push(arbFile.filePath);
          }
        }
      }
      
      // 触发变更事件
      for (const filePath of affectedFiles) {
        this.changeEmitter.fire({
          filePath,
          changeType: 'modified',
          timestamp: Date.now(),
          affectedKeys: [key || localeOrKey]
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete translation:`, error);
      return false;
    }
  }

  /**
   * 创建新的翻译键
   */
  public async createTranslationKey(key: string, defaultValue: string, description?: string): Promise<boolean> {
    try {
      // 在所有 ARB 文件中创建键
      const promises: Promise<boolean>[] = [];
      
      for (const [locale, arbFile] of this.arbFiles) {
        const value = locale === this.getDefaultLocale() ? defaultValue : '';
        promises.push(this.setTranslation(key, locale, value, description));
      }
      
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error(`Failed to create translation key ${key}:`, error);
      return false;
    }
  }

  /**
   * 保存 ARB 文件
   */
  private async saveArbFile(arbFile: ArbFile): Promise<void> {
    try {
      const jsonData: any = {};
      
      // 添加翻译条目
      for (const [key, entry] of arbFile.entries) {
        jsonData[key] = entry.value;
        
        // 添加元数据
        if (entry.description || entry.placeholders || entry.metadata) {
          const metadata: any = {};
          
          if (entry.description) {
            metadata.description = entry.description;
          }
          
          if (entry.placeholders) {
            metadata.placeholders = entry.placeholders;
          }
          
          if (entry.metadata) {
            Object.assign(metadata, entry.metadata);
          }
          
          jsonData[`@${key}`] = metadata;
        }
      }
      
      // 格式化 JSON
      const content = JSON.stringify(jsonData, null, 2);
      
      // 写入文件
      await fs.writeFile(arbFile.filePath, content, 'utf-8');
      
      // 更新最后修改时间
      arbFile.lastModified = Date.now();
    } catch (error) {
      console.error(`Failed to save ARB file ${arbFile.filePath}:`, error);
      throw error;
    }
  }

  /**
   * 保存指定语言的 ARB 文件
   */
  public async saveArbFileByLocale(locale: string): Promise<void> {
    const arbFile = this.arbFiles.get(locale);
    if (!arbFile) {
      throw new Error(`ARB file for locale ${locale} not found`);
    }
    await this.saveArbFile(arbFile);
  }

  /**
   * 获取所有翻译键
   */
  public getAllKeys(): Set<string> {
    const keys = new Set<string>();
    
    for (const arbFile of this.arbFiles.values()) {
      for (const key of arbFile.entries.keys()) {
        keys.add(key);
      }
    }
    
    return keys;
  }

  /**
   * 获取所有翻译键（数组形式）
   */
  public getAllKeysArray(): string[] {
    return Array.from(this.getAllKeys());
  }

  /**
   * 排序翻译键
   */
  public async sortTranslations(locale: string): Promise<void> {
    const arbFile = this.arbFiles.get(locale);
    if (!arbFile) {
      throw new Error(`ARB file for locale ${locale} not found`);
    }

    // 获取所有键并排序
    const sortedKeys = Array.from(arbFile.entries.keys()).sort();
    
    // 创建新的有序 Map
    const sortedEntries = new Map<string, ArbEntry>();
    for (const key of sortedKeys) {
      const entry = arbFile.entries.get(key);
      if (entry) {
        sortedEntries.set(key, entry);
      }
    }
    
    // 替换原有的 entries
    arbFile.entries = sortedEntries;
  }

  /**
   * 获取缺失翻译的键
   */
  public getMissingTranslations(): Map<string, string[]> {
    const missingTranslations = new Map<string, string[]>();
    const allKeys = this.getAllKeys();
    const allLocales = Array.from(this.arbFiles.keys());
    
    for (const key of allKeys) {
      const missingLocales: string[] = [];
      
      for (const locale of allLocales) {
        const translation = this.getTranslation(key, locale);
        if (!translation || translation.trim() === '') {
          missingLocales.push(locale);
        }
      }
      
      if (missingLocales.length > 0) {
        missingTranslations.set(key, missingLocales);
      }
    }
    
    return missingTranslations;
  }

  /**
   * 获取默认语言
   */
  public getDefaultLocale(): string {
    // 查找模板文件对应的语言
    for (const arbFile of this.arbFiles.values()) {
      if (arbFile.isTemplate) {
        return arbFile.locale;
      }
    }
    
    // 如果没有找到模板文件，返回 'en'
    return 'en';
  }

  /**
   * 设置文件监听器
   */
  private setupFileWatchers(arbDirectory: string): void {
    const pattern = path.join(arbDirectory, '*.arb');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    
    watcher.onDidChange(async (uri) => {
      await this.handleFileChange(uri.fsPath, 'modified');
    });
    
    watcher.onDidCreate(async (uri) => {
      await this.handleFileChange(uri.fsPath, 'created');
    });
    
    watcher.onDidDelete(async (uri) => {
      await this.handleFileChange(uri.fsPath, 'deleted');
    });
    
    this.fileWatchers.push(watcher);
  }

  /**
   * 处理文件变更
   */
  private async handleFileChange(filePath: string, changeType: 'created' | 'modified' | 'deleted'): Promise<void> {
    try {
      const fileName = path.basename(filePath, '.arb');
      const localeMatch = fileName.match(/app_([a-z]{2}(?:_[A-Z]{2})?)$/);
      const locale = localeMatch ? localeMatch[1] : fileName.replace('app_', '') || 'en';
      
      if (changeType === 'deleted') {
        this.arbFiles.delete(locale);
      } else {
        await this.loadArbFile(filePath);
      }
      
      this.changeEmitter.fire({
        filePath,
        changeType,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Failed to handle file change for ${filePath}:`, error);
    }
  }

  /**
   * 验证 ARB 文件格式
   */
  public validateArbFile(filePath: string): string[] {
    const issues: string[] = [];
    
    try {
      const arbFile = Array.from(this.arbFiles.values()).find(file => file.filePath === filePath);
      if (!arbFile) {
        issues.push('ARB file not loaded');
        return issues;
      }
      
      // 检查是否有重复的键
      const keys = Array.from(arbFile.entries.keys());
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size) {
        issues.push('Duplicate keys found');
      }
      
      // 检查键名格式
      for (const key of keys) {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
          issues.push(`Invalid key format: ${key}`);
        }
      }
      
      // 检查占位符一致性
      for (const [key, entry] of arbFile.entries) {
        if (entry.placeholders) {
          const placeholderNames = Object.keys(entry.placeholders);
          const valuePlaceholders = entry.value.match(/{([^}]+)}/g) || [];
          const valueNames = valuePlaceholders.map(p => p.slice(1, -1));
          
          for (const name of placeholderNames) {
            if (!valueNames.includes(name)) {
              issues.push(`Unused placeholder '${name}' in key '${key}'`);
            }
          }
          
          for (const name of valueNames) {
            if (!placeholderNames.includes(name)) {
              issues.push(`Missing placeholder definition '${name}' in key '${key}'`);
            }
          }
        }
      }
    } catch (error) {
      issues.push(`Validation error: ${error}`);
    }
    
    return issues;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 清理文件监听器
    for (const watcher of this.fileWatchers) {
      watcher.dispose();
    }
    this.fileWatchers = [];
    
    // 清理事件发射器
    this.changeEmitter.dispose();
    
    // 清理缓存
    this.arbFiles.clear();
  }
}

/**
 * 获取 ARB 管理器实例
 */
export function getArbManager(): ArbManager {
  return ArbManager.getInstance();
}