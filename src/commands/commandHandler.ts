/**
 * 命令处理器
 * 处理插件的各种命令操作
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getDartParser } from '../core/dartParser';
import { getArbManager } from '../core/arbManager';
import { getProjectDetector } from '../core/projectDetector';
import { QuickTranslationEditor } from '../editors/translationEditor';
import { I18nReference, TranslationStatus, I18nPatternType } from '../types';

export class CommandHandler {
  private dartParser = getDartParser();
  private arbManager = getArbManager();
  private projectDetector = getProjectDetector();
  private quickEditor = new QuickTranslationEditor();
  
  /**
   * 注册所有命令
   */
  public static registerCommands(context: vscode.ExtensionContext): void {
    const handler = new CommandHandler();
    
    // 注册命令
    const commands = [
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.helloWorld', handler.helloWorld),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.editTranslation', handler.editTranslation),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.createTranslation', handler.createTranslation),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.deleteTranslation', handler.deleteTranslation),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.copyKey', handler.copyKey),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.findUsages', handler.findUsages),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.replaceKey', handler.replaceKey),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.showAllTranslations', handler.showAllTranslations),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.showStatistics', handler.showStatistics),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.refreshProject', handler.refreshProject),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.validateTranslations', handler.validateTranslations),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.exportTranslations', handler.exportTranslations),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.importTranslations', handler.importTranslations),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.generateMissingKeys', handler.generateMissingKeys),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.sortTranslations', handler.sortTranslations),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.duplicateTranslation', handler.duplicateTranslation),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.openTranslationEditor', handler.openTranslationEditor),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.extractToTranslation', handler.extractToTranslation),
      vscode.commands.registerCommand('flutter-i18n-vscode-inline.previewTranslation', handler.previewTranslation)
    ];
    
    // 添加到订阅
    context.subscriptions.push(...commands);
  }
  
  /**
   * Hello World 命令（示例）
   */
  private helloWorld = async (): Promise<void> => {
    vscode.window.showInformationMessage('Hello World from Flutter i18n VS Code Inline!');
  };
  
  /**
   * 编辑翻译命令
   */
  private editTranslation = async (key?: string, range?: vscode.Range): Promise<void> => {
    try {
      // 如果没有提供 key，尝试从当前位置获取
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'dart') {
          vscode.window.showErrorMessage('Please open a Dart file and place cursor on an i18n key');
          return;
        }
        
        const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
        if (!reference || !reference.isValid) {
          vscode.window.showErrorMessage('No valid i18n key found at cursor position');
          return;
        }
        
        key = reference.key;
        range = reference.range;
      }
      
      // 显示快速编辑器
      await this.quickEditor.showQuickEdit(key, range);
    } catch (error) {
      console.error('Error editing translation:', error);
      vscode.window.showErrorMessage(`Failed to edit translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 创建翻译命令
   */
  private createTranslation = async (key?: string, range?: vscode.Range): Promise<void> => {
    try {
      // 如果没有提供 key，请求用户输入
      if (!key) {
        key = await vscode.window.showInputBox({
          prompt: 'Enter translation key',
          validateInput: (value) => {
            if (!value || !value.trim()) {
              return 'Translation key is required';
            }
            if (this.arbManager.getAllKeysArray().includes(value)) {
              return 'Translation key already exists';
            }
            return null;
          }
        });
        
        if (!key) {
          return;
        }
      }
      
      // 获取项目配置
      const projectConfig = this.projectDetector.getProjectConfig();
      if (!projectConfig) {
        vscode.window.showErrorMessage('No Flutter project configuration found');
        return;
      }
      
      // 获取所有语言
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      if (locales.length === 0) {
        vscode.window.showErrorMessage('No ARB files found in project');
        return;
      }
      
      // 为默认语言创建翻译
      const defaultLocale = projectConfig.defaultLocale;
      const defaultTranslation = await vscode.window.showInputBox({
        prompt: `Enter translation for '${key}' in ${defaultLocale}`,
        validateInput: (value) => {
          if (!value || !value.trim()) {
            return 'Translation cannot be empty';
          }
          return null;
        }
      });
      
      if (!defaultTranslation) {
        return;
      }
      
      // 保存默认翻译
      await this.arbManager.setTranslation(defaultLocale, key, defaultTranslation);
      await this.arbManager.saveArbFileByLocale(defaultLocale);
      
      // 询问是否为其他语言创建翻译
      const otherLocales = locales.filter(locale => locale !== defaultLocale);
      if (otherLocales.length > 0) {
        const createOthers = await vscode.window.showQuickPick(
          ['Yes', 'No'],
          { placeHolder: 'Create translations for other languages?' }
        );
        
        if (createOthers === 'Yes') {
          await this.quickEditor.showQuickEdit(key, range);
        }
      }
      
      vscode.window.showInformationMessage(`Translation key '${key}' created successfully`);
      
      // 如果有范围信息，插入代码
      if (range) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const codeSnippet = this.dartParser.generateReference(key, I18nPatternType.CONTEXT_L10N, []);
          await editor.edit(editBuilder => {
            editBuilder.replace(range, codeSnippet);
          });
        }
      }
    } catch (error) {
      console.error('Error creating translation:', error);
      vscode.window.showErrorMessage(`Failed to create translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 删除翻译命令
   */
  private deleteTranslation = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，从当前位置获取或让用户选择
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'dart') {
          const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
          if (reference && reference.isValid) {
            key = reference.key;
          }
        }
        
        if (!key) {
          // 让用户从现有键中选择
          const allKeys = this.arbManager.getAllKeysArray();
          if (allKeys.length === 0) {
            vscode.window.showInformationMessage('No translation keys found');
            return;
          }
          
          key = await vscode.window.showQuickPick(allKeys, {
            placeHolder: 'Select translation key to delete'
          });
          
          if (!key) {
            return;
          }
        }
      }
      
      // 确认删除
      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the translation key '${key}'? This action cannot be undone.`,
        'Delete',
        'Cancel'
      );
      
      if (confirmation !== 'Delete') {
        return;
      }
      
      // 删除翻译
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      for (const locale of locales) {
        await this.arbManager.deleteTranslation(locale, key);
      }
      
      // 保存所有文件
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }
      
      vscode.window.showInformationMessage(`Translation key '${key}' deleted successfully`);
    } catch (error) {
      console.error('Error deleting translation:', error);
      vscode.window.showErrorMessage(`Failed to delete translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 复制键命令
   */
  private copyKey = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，从当前位置获取
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'dart') {
          vscode.window.showErrorMessage('Please open a Dart file and place cursor on an i18n key');
          return;
        }
        
        const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
        if (!reference || !reference.isValid) {
          vscode.window.showErrorMessage('No valid i18n key found at cursor position');
          return;
        }
        
        key = reference.key;
      }
      
      // 复制到剪贴板
      await vscode.env.clipboard.writeText(key);
      vscode.window.showInformationMessage(`Translation key '${key}' copied to clipboard`);
    } catch (error) {
      console.error('Error copying key:', error);
      vscode.window.showErrorMessage(`Failed to copy key: ${(error as Error).message}`);
    }
  };
  
  /**
   * 查找用法命令
   */
  private findUsages = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，从当前位置获取或让用户选择
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'dart') {
          const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
          if (reference && reference.isValid) {
            key = reference.key;
          }
        }
        
        if (!key) {
          const allKeys = this.arbManager.getAllKeysArray();
          if (allKeys.length === 0) {
            vscode.window.showInformationMessage('No translation keys found');
            return;
          }
          
          key = await vscode.window.showQuickPick(allKeys, {
            placeHolder: 'Select translation key to find usages'
          });
          
          if (!key) {
            return;
          }
        }
      }
      
      // 在工作区中搜索用法
      await vscode.commands.executeCommand('workbench.action.findInFiles', {
        query: key,
        triggerSearch: true,
        matchWholeWord: true,
        isCaseSensitive: true
      });
    } catch (error) {
      console.error('Error finding usages:', error);
      vscode.window.showErrorMessage(`Failed to find usages: ${(error as Error).message}`);
    }
  };
  
  /**
   * 替换键命令
   */
  private replaceKey = async (oldKey: string, newKey: string, range?: vscode.Range): Promise<void> => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !range) {
        vscode.window.showErrorMessage('No active editor or range provided');
        return;
      }
      
      // 替换代码中的键
      await editor.edit(editBuilder => {
        editBuilder.replace(range, newKey);
      });
      
      vscode.window.showInformationMessage(`Replaced '${oldKey}' with '${newKey}'`);
    } catch (error) {
      console.error('Error replacing key:', error);
      vscode.window.showErrorMessage(`Failed to replace key: ${(error as Error).message}`);
    }
  };
  
  /**
   * 显示所有翻译命令
   */
  private showAllTranslations = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，从当前位置获取或让用户选择
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'dart') {
          const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
          if (reference && reference.isValid) {
            key = reference.key;
          }
        }
        
        if (!key) {
          const allKeys = this.arbManager.getAllKeysArray();
          if (allKeys.length === 0) {
            vscode.window.showInformationMessage('No translation keys found');
            return;
          }
          
          key = await vscode.window.showQuickPick(allKeys, {
            placeHolder: 'Select translation key to view all translations'
          });
          
          if (!key) {
            return;
          }
        }
      }
      
      // 获取所有翻译
      const translations = this.arbManager.getAllTranslations(key);
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      
      // 创建显示内容
      const items: vscode.QuickPickItem[] = [];
      
      for (const locale of locales) {
        const translation = translations.get(locale);
        const status = translation ? '✅' : '❌';
        const value = translation || 'No translation';
        
        items.push({
          label: `${status} ${locale}`,
          description: value,
          detail: this.getLocaleName(locale)
        });
      }
      
      // 显示快速选择
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `All translations for: ${key}`,
        canPickMany: false
      });
      
      if (selected) {
        // 复制选中的翻译到剪贴板
        await vscode.env.clipboard.writeText(selected.description || '');
        vscode.window.showInformationMessage('Translation copied to clipboard');
      }
    } catch (error) {
      console.error('Error showing all translations:', error);
      vscode.window.showErrorMessage(`Failed to show all translations: ${(error as Error).message}`);
    }
  };
  
  /**
   * 显示统计信息命令
   */
  private showStatistics = async (filePath?: string): Promise<void> => {
    try {
      const allKeys = this.arbManager.getAllKeysArray();
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      
      let completeCount = 0;
      let partialCount = 0;
      let missingCount = 0;
      
      for (const key of allKeys) {
        const translations = this.arbManager.getAllTranslations(key);
        const status = this.getTranslationStatus(key, translations);
        
        switch (status) {
          case TranslationStatus.COMPLETE:
            completeCount++;
            break;
          case TranslationStatus.PARTIAL:
            partialCount++;
            break;
          case TranslationStatus.MISSING:
            missingCount++;
            break;
        }
      }
      
      // 创建统计信息
      const stats = [
        `📊 **Translation Statistics**`,
        ``,
        `**Total Keys:** ${allKeys.length}`,
        `**Languages:** ${locales.length}`,
        ``,
        `**Status:**`,
        `- ✅ Complete: ${completeCount}`,
        `- ⚠️ Partial: ${partialCount}`,
        `- ❌ Missing: ${missingCount}`,
        ``,
        `**Completion Rate:** ${allKeys.length > 0 ? Math.round((completeCount / allKeys.length) * 100) : 0}%`
      ];
      
      // 显示在新文档中
      const doc = await vscode.workspace.openTextDocument({
        content: stats.join('\n'),
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      console.error('Error showing statistics:', error);
      vscode.window.showErrorMessage(`Failed to show statistics: ${(error as Error).message}`);
    }
  };
  
  /**
   * 刷新项目命令
   */
  private refreshProject = async (): Promise<void> => {
    try {
      // 重新检测项目配置
      const projectConfig = await this.projectDetector.refreshConfig();
      
      if (projectConfig) {
        // 重新初始化 ARB 管理器
        await this.arbManager.initialize(projectConfig);
      }
      
      vscode.window.showInformationMessage('Project refreshed successfully');
    } catch (error) {
      console.error('Error refreshing project:', error);
      vscode.window.showErrorMessage(`Failed to refresh project: ${(error as Error).message}`);
    }
  };
  
  /**
   * 验证翻译命令
   */
  private validateTranslations = async (): Promise<void> => {
    try {
      const allKeys = this.arbManager.getAllKeysArray();
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      const issues: string[] = [];
      
      for (const key of allKeys) {
        const translations = this.arbManager.getAllTranslations(key);
        
        // 检查缺失翻译
        const missingLocales = locales.filter(locale => !translations.has(locale));
        if (missingLocales.length > 0) {
          issues.push(`❌ '${key}' missing in: ${missingLocales.join(', ')}`);
        }
        
        // 检查空翻译
        for (const [locale, translation] of translations) {
          if (!translation.trim()) {
            issues.push(`⚠️ '${key}' is empty in ${locale}`);
          }
        }
      }
      
      // 显示结果
      if (issues.length === 0) {
        vscode.window.showInformationMessage('✅ All translations are valid!');
      } else {
        const content = [
          `🔍 **Translation Validation Results**`,
          ``,
          `Found ${issues.length} issue(s):`,
          ``,
          ...issues
        ].join('\n');
        
        const doc = await vscode.workspace.openTextDocument({
          content,
          language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc);
      }
    } catch (error) {
      console.error('Error validating translations:', error);
      vscode.window.showErrorMessage(`Failed to validate translations: ${(error as Error).message}`);
    }
  };
  
  /**
   * 导出翻译命令
   */
  private exportTranslations = async (): Promise<void> => {
    try {
      const format = await vscode.window.showQuickPick(
        ['JSON', 'CSV', 'Excel'],
        { placeHolder: 'Select export format' }
      );
      
      if (!format) {
        return;
      }
      
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`translations.${format.toLowerCase()}`),
        filters: {
          'JSON': ['json'],
          'CSV': ['csv'],
          'Excel': ['xlsx']
        }
      });
      
      if (!uri) {
        return;
      }
      
      // 简单的 JSON 导出实现
      if (format === 'JSON') {
        const allKeys = this.arbManager.getAllKeysArray();
        const locales = Array.from(this.arbManager.getArbFiles().keys());
        const exportData: any = {};
        
        for (const key of allKeys) {
          exportData[key] = {};
          for (const locale of locales) {
            const translation = this.arbManager.getAllTranslations(key).get(locale);
            exportData[key][locale] = translation || '';
          }
        }
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
      }
      
      vscode.window.showInformationMessage(`Translations exported to ${uri.fsPath}`);
    } catch (error) {
      console.error('Error exporting translations:', error);
      vscode.window.showErrorMessage(`Failed to export translations: ${(error as Error).message}`);
    }
  };
  
  /**
   * 导入翻译命令
   */
  private importTranslations = async (): Promise<void> => {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
          'JSON': ['json'],
          'CSV': ['csv'],
          'Excel': ['xlsx']
        }
      });
      
      if (!uris || uris.length === 0) {
        return;
      }
      
      const uri = uris[0];
      const content = await vscode.workspace.fs.readFile(uri);
      
      // 简单的 JSON 导入实现
      if (uri.fsPath.endsWith('.json')) {
        const importData = JSON.parse(content.toString());
        
        for (const [key, translations] of Object.entries(importData as any)) {
          for (const [locale, value] of Object.entries(translations as any)) {
            if (value && typeof value === 'string') {
              await this.arbManager.setTranslation(locale, key, value);
            }
          }
        }
        
        // 保存所有文件
        const locales = Array.from(this.arbManager.getArbFiles().keys());
        for (const locale of locales) {
          await this.arbManager.saveArbFileByLocale(locale);
        }
      }
      
      vscode.window.showInformationMessage(`Translations imported from ${uri.fsPath}`);
    } catch (error) {
      console.error('Error importing translations:', error);
      vscode.window.showErrorMessage(`Failed to import translations: ${(error as Error).message}`);
    }
  };
  
  /**
   * 生成缺失键命令
   */
  private generateMissingKeys = async (): Promise<void> => {
    try {
      const allKeys = this.arbManager.getAllKeysArray();
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      const projectConfig = this.projectDetector.getProjectConfig();
      
      if (!projectConfig) {
        vscode.window.showErrorMessage('No Flutter project configuration found');
        return;
      }
      
      const defaultLocale = projectConfig.defaultLocale;
      let generatedCount = 0;
      
      for (const key of allKeys) {
        const translations = this.arbManager.getAllTranslations(key);
        const defaultTranslation = translations.get(defaultLocale);
        
        if (!defaultTranslation) {
          continue;
        }
        
        for (const locale of locales) {
          if (locale !== defaultLocale && !translations.has(locale)) {
            // 生成占位符翻译
            const placeholder = `[${locale.toUpperCase()}] ${defaultTranslation}`;
            await this.arbManager.setTranslation(locale, key, placeholder);
            generatedCount++;
          }
        }
      }
      
      // 保存所有文件
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }
      
      vscode.window.showInformationMessage(
        `Generated ${generatedCount} missing translation placeholders`
      );
    } catch (error) {
      console.error('Error generating missing keys:', error);
      vscode.window.showErrorMessage(`Failed to generate missing keys: ${(error as Error).message}`);
    }
  };
  
  /**
   * 排序翻译命令
   */
  private sortTranslations = async (): Promise<void> => {
    try {
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      
      for (const locale of locales) {
        await this.arbManager.sortTranslations(locale);
        await this.arbManager.saveArbFileByLocale(locale);
      }
      
      vscode.window.showInformationMessage('All translation files sorted alphabetically');
    } catch (error) {
      console.error('Error sorting translations:', error);
      vscode.window.showErrorMessage(`Failed to sort translations: ${(error as Error).message}`);
    }
  };
  
  /**
   * 复制翻译命令
   */
  private duplicateTranslation = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，让用户选择
      if (!key) {
        const allKeys = this.arbManager.getAllKeysArray();
        if (allKeys.length === 0) {
          vscode.window.showInformationMessage('No translation keys found');
          return;
        }
        
        key = await vscode.window.showQuickPick(allKeys, {
          placeHolder: 'Select translation key to duplicate'
        });
        
        if (!key) {
          return;
        }
      }
      
      // 请求新键名
      const newKey = await vscode.window.showInputBox({
        prompt: `Enter new key name (duplicating from '${key}')`,
        value: `${key}_copy`,
        validateInput: (value) => {
          if (!value || !value.trim()) {
            return 'New key name is required';
          }
          if (this.arbManager.getAllKeysArray().includes(value)) {
            return 'Key already exists';
          }
          return null;
        }
      });
      
      if (!newKey) {
        return;
      }
      
      // 复制所有翻译
      const translations = this.arbManager.getAllTranslations(key);
      for (const [locale, translation] of translations) {
        await this.arbManager.setTranslation(locale, newKey, translation);
      }
      
      // 保存所有文件
      const locales = Array.from(this.arbManager.getArbFiles().keys());
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }
      
      vscode.window.showInformationMessage(`Translation '${key}' duplicated as '${newKey}'`);
    } catch (error) {
      console.error('Error duplicating translation:', error);
      vscode.window.showErrorMessage(`Failed to duplicate translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 打开翻译编辑器命令
   */
  private openTranslationEditor = async (): Promise<void> => {
    try {
      const uri = vscode.Uri.parse('flutter-i18n-translation:translations');
      await vscode.commands.executeCommand('vscode.openWith', uri, 'flutter-i18n-vscode-inline.translationEditor');
    } catch (error) {
      console.error('Error opening translation editor:', error);
      vscode.window.showErrorMessage(`Failed to open translation editor: ${(error as Error).message}`);
    }
  };
  
  /**
   * 提取到翻译命令
   */
  private extractToTranslation = async (): Promise<void> => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'dart') {
        vscode.window.showErrorMessage('Please open a Dart file and select text to extract');
        return;
      }
      
      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage('Please select text to extract to translation');
        return;
      }
      
      const selectedText = editor.document.getText(selection);
      
      // 清理选中的文本（移除引号等）
      const cleanText = selectedText.replace(/^['"`]|['"`]$/g, '');
      
      // 生成键名建议
      const suggestedKey = this.generateKeyFromText(cleanText);
      
      // 请求键名
      const key = await vscode.window.showInputBox({
        prompt: 'Enter translation key',
        value: suggestedKey,
        validateInput: (value) => {
          if (!value || !value.trim()) {
            return 'Translation key is required';
          }
          if (this.arbManager.getAllKeysArray().includes(value)) {
            return 'Translation key already exists';
          }
          return null;
        }
      });
      
      if (!key) {
        return;
      }
      
      // 获取项目配置
      const projectConfig = this.projectDetector.getProjectConfig();
      if (!projectConfig) {
        vscode.window.showErrorMessage('No Flutter project configuration found');
        return;
      }
      
      // 创建翻译
      const defaultLocale = projectConfig.defaultLocale;
      await this.arbManager.setTranslation(defaultLocale, key, cleanText);
      await this.arbManager.saveArbFileByLocale(defaultLocale);
      
      // 替换选中的文本
      const codeSnippet = this.dartParser.generateReference(key, I18nPatternType.CONTEXT_L10N, []);
      await editor.edit(editBuilder => {
        editBuilder.replace(selection, codeSnippet);
      });
      
      vscode.window.showInformationMessage(`Text extracted to translation key '${key}'`);
    } catch (error) {
      console.error('Error extracting to translation:', error);
      vscode.window.showErrorMessage(`Failed to extract to translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 预览翻译命令
   */
  private previewTranslation = async (key?: string): Promise<void> => {
    try {
      // 如果没有提供 key，从当前位置获取
      if (!key) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'dart') {
          vscode.window.showErrorMessage('Please open a Dart file and place cursor on an i18n key');
          return;
        }
        
        const reference = this.dartParser.getReferenceAtPosition(editor.document, editor.selection.active);
        if (!reference || !reference.isValid) {
          vscode.window.showErrorMessage('No valid i18n key found at cursor position');
          return;
        }
        
        key = reference.key;
      }
      
      // 获取翻译
      const translations = this.arbManager.getAllTranslations(key);
      if (translations.size === 0) {
        vscode.window.showWarningMessage(`No translations found for key '${key}'`);
        return;
      }
      
      // 选择预览语言
      const locales = Array.from(translations.keys());
      const selectedLocale = await vscode.window.showQuickPick(locales, {
        placeHolder: 'Select language to preview'
      });
      
      if (!selectedLocale) {
        return;
      }
      
      const translation = translations.get(selectedLocale);
      if (translation) {
        vscode.window.showInformationMessage(
          `${this.getLocaleName(selectedLocale)}: "${translation}"`,
          'Copy'
        ).then(action => {
          if (action === 'Copy') {
            vscode.env.clipboard.writeText(translation);
          }
        });
      }
    } catch (error) {
      console.error('Error previewing translation:', error);
      vscode.window.showErrorMessage(`Failed to preview translation: ${(error as Error).message}`);
    }
  };
  
  /**
   * 获取翻译状态
   */
  private getTranslationStatus(key: string, translations: Map<string, string>): TranslationStatus {
    const totalLocales = this.arbManager.getArbFiles().size;
    const translatedLocales = translations.size;
    
    if (translatedLocales === 0) {
      return TranslationStatus.MISSING;
    } else if (translatedLocales < totalLocales) {
      return TranslationStatus.PARTIAL;
    } else {
      return TranslationStatus.COMPLETE;
    }
  }
  
  /**
   * 获取语言名称
   */
  private getLocaleName(locale: string): string {
    const nameMap: { [key: string]: string } = {
      'en': 'English',
      'zh': 'Chinese',
      'zh_CN': 'Chinese (Simplified)',
      'zh_TW': 'Chinese (Traditional)',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic'
    };
    
    return nameMap[locale] || locale.toUpperCase();
  }
  
  /**
   * 从文本生成键名
   */
  private generateKeyFromText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);
  }
}