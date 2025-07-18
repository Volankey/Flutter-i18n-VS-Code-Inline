/**
 * Flutter 项目检测器
 * 负责检测当前工作区是否为 Flutter 项目，并解析 i18n 配置
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectConfig, L10nConfig } from '../types';

export class ProjectDetector {
  private static instance: ProjectDetector;
  private projectConfig: ProjectConfig | null = null;
  private configChangeEmitter = new vscode.EventEmitter<ProjectConfig | null>();

  public readonly onConfigChanged = this.configChangeEmitter.event;

  private constructor() {}

  public static getInstance(): ProjectDetector {
    if (!ProjectDetector.instance) {
      ProjectDetector.instance = new ProjectDetector();
    }
    return ProjectDetector.instance;
  }

  /**
   * 检测并初始化项目配置
   */
  public async detectProject(
    workspaceFolder?: vscode.WorkspaceFolder
  ): Promise<ProjectConfig | null> {
    try {
      const folder = workspaceFolder || this.getCurrentWorkspaceFolder();
      if (!folder) {
        return null;
      }

      const config = await this.analyzeProject(folder.uri.fsPath);
      this.projectConfig = config;
      this.configChangeEmitter.fire(config);

      return config;
    } catch (error) {
      console.error('Failed to detect Flutter project:', error);
      return null;
    }
  }

  /**
   * 获取当前项目配置
   */
  public getProjectConfig(): ProjectConfig | null {
    return this.projectConfig;
  }

  /**
   * 刷新项目配置
   */
  public async refreshConfig(): Promise<ProjectConfig | null> {
    return this.detectProject();
  }

  /**
   * 分析项目结构和配置
   */
  private async analyzeProject(projectPath: string): Promise<ProjectConfig | null> {
    // 检查是否为 Flutter 项目
    const isFlutter = await this.isFlutterProject(projectPath);
    if (!isFlutter) {
      return null;
    }

    // 解析 l10n 配置
    const l10nConfig = await this.parseL10nConfig(projectPath);

    // 解析 pubspec.yaml 中的配置
    const pubspecConfig = await this.parsePubspecConfig(projectPath);

    // 扫描 ARB 文件
    const arbInfo = await this.scanArbFiles(projectPath, l10nConfig, pubspecConfig);

    return {
      isFlutterProject: true,
      arbDirectory: arbInfo.arbDirectory,
      supportedLocales: arbInfo.supportedLocales,
      templateArbFile: arbInfo.templateArbFile,
      defaultLocale: arbInfo.defaultLocale,
      generatedDir: l10nConfig?.['output-localization-file']
        ? path.dirname(path.resolve(projectPath, l10nConfig['output-localization-file']))
        : path.join(projectPath, '.dart_tool', 'flutter_gen', 'gen_l10n'),
      classPrefix: l10nConfig?.['output-class'] || 'AppLocalizations',
      syntheticPackage: l10nConfig?.['synthetic-package'] ?? true,
    };
  }

  /**
   * 检查是否为 Flutter 项目
   */
  private async isFlutterProject(projectPath: string): Promise<boolean> {
    try {
      const pubspecPath = path.join(projectPath, 'pubspec.yaml');
      const pubspecContent = await fs.readFile(pubspecPath, 'utf-8');

      // 检查是否包含 Flutter SDK 依赖
      const hasFlutterSdk = /^\s*flutter:\s*$/m.test(pubspecContent);

      // 检查是否包含 flutter_localizations 依赖
      const hasLocalizations = /flutter_localizations:/m.test(pubspecContent);

      return hasFlutterSdk && hasLocalizations;
    } catch (error) {
      return false;
    }
  }

  /**
   * 解析 l10n.yaml 配置文件
   */
  private async parseL10nConfig(projectPath: string): Promise<L10nConfig | null> {
    try {
      const l10nPath = path.join(projectPath, 'l10n.yaml');
      const content = await fs.readFile(l10nPath, 'utf-8');

      // 简单的 YAML 解析（仅支持基本的键值对）
      const config: L10nConfig = {};
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^:]+):\s*(.*)$/);
          if (match) {
            const key = match[1].trim() as keyof L10nConfig;
            const value = match[2].trim();

            // 处理不同类型的值
            if (value === 'true' || value === 'false') {
              (config as any)[key] = value === 'true';
            } else if (value.startsWith('[') && value.endsWith(']')) {
              // 简单的数组解析
              const arrayContent = value.slice(1, -1);
              (config as any)[key] = arrayContent
                .split(',')
                .map(item => item.trim().replace(/["']/g, ''));
            } else {
              (config as any)[key] = value.replace(/["']/g, '');
            }
          }
        }
      }

      return config;
    } catch (error) {
      return null;
    }
  }

  /**
   * 解析 pubspec.yaml 中的 flutter 配置
   */
  private async parsePubspecConfig(projectPath: string): Promise<any> {
    try {
      const pubspecPath = path.join(projectPath, 'pubspec.yaml');
      const content = await fs.readFile(pubspecPath, 'utf-8');

      // 查找 flutter.generate 配置
      const generateMatch = content.match(/^\s*generate:\s*(true|false)\s*$/m);
      const generate = generateMatch ? generateMatch[1] === 'true' : false;

      return { generate };
    } catch (error) {
      return { generate: false };
    }
  }

  /**
   * 扫描 ARB 文件
   */
  private async scanArbFiles(
    projectPath: string,
    l10nConfig: L10nConfig | null,
    pubspecConfig: any
  ) {
    const arbDirectory = l10nConfig?.['arb-dir']
      ? path.resolve(projectPath, l10nConfig['arb-dir'])
      : path.join(projectPath, 'lib', 'l10n');

    let supportedLocales: string[] = [];
    let templateArbFile = '';
    let defaultLocale = 'en';

    try {
      // 检查 ARB 目录是否存在
      await fs.access(arbDirectory);

      // 扫描 ARB 文件
      const files = await fs.readdir(arbDirectory);
      const arbFiles = files.filter(file => file.endsWith('.arb'));

      // 提取语言代码
      supportedLocales = arbFiles
        .map(file => {
          const match = file.match(/app_([a-z]{2}(?:_[A-Z]{2})?)\.arb$/);
          return match ? match[1] : file.replace('.arb', '').replace('app_', '');
        })
        .filter(locale => locale);

      // 确定模板文件
      templateArbFile = l10nConfig?.['template-arb-file'] || 'app_en.arb';
      if (!arbFiles.includes(templateArbFile)) {
        // 如果指定的模板文件不存在，使用第一个找到的文件
        templateArbFile = arbFiles[0] || 'app_en.arb';
      }

      // 确定默认语言
      const templateMatch = templateArbFile.match(/app_([a-z]{2}(?:_[A-Z]{2})?)\.arb$/);
      if (templateMatch) {
        defaultLocale = templateMatch[1];
      }
    } catch (error) {
      // ARB 目录不存在，使用默认配置
      console.warn('ARB directory not found, using default configuration');
    }

    return {
      arbDirectory,
      supportedLocales,
      templateArbFile,
      defaultLocale,
    };
  }

  /**
   * 获取当前工作区文件夹
   */
  private getCurrentWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    // 如果有多个工作区，尝试找到包含 pubspec.yaml 的文件夹
    if (workspaceFolders.length > 1) {
      for (const folder of workspaceFolders) {
        const pubspecPath = path.join(folder.uri.fsPath, 'pubspec.yaml');
        try {
          require('fs').accessSync(pubspecPath);
          return folder;
        } catch {
          continue;
        }
      }
    }

    return workspaceFolders[0];
  }

  /**
   * 监听配置文件变化
   */
  public setupConfigWatcher(): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];

    // 监听 l10n.yaml 变化
    const l10nWatcher = vscode.workspace.createFileSystemWatcher('**/l10n.yaml');
    l10nWatcher.onDidChange(() => this.refreshConfig());
    l10nWatcher.onDidCreate(() => this.refreshConfig());
    l10nWatcher.onDidDelete(() => this.refreshConfig());
    disposables.push(l10nWatcher);

    // 监听 pubspec.yaml 变化
    const pubspecWatcher = vscode.workspace.createFileSystemWatcher('**/pubspec.yaml');
    pubspecWatcher.onDidChange(() => this.refreshConfig());
    disposables.push(pubspecWatcher);

    return vscode.Disposable.from(...disposables);
  }

  /**
   * 验证项目配置
   */
  public async validateConfig(config: ProjectConfig): Promise<string[]> {
    const issues: string[] = [];

    try {
      // 检查 ARB 目录是否存在
      await fs.access(config.arbDirectory);
    } catch {
      issues.push(`ARB directory does not exist: ${config.arbDirectory}`);
    }

    try {
      // 检查模板文件是否存在
      const templatePath = path.join(config.arbDirectory, config.templateArbFile);
      await fs.access(templatePath);
    } catch {
      issues.push(`Template ARB file does not exist: ${config.templateArbFile}`);
    }

    // 检查支持的语言列表是否为空
    if (config.supportedLocales.length === 0) {
      issues.push('No supported locales found');
    }

    return issues;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.configChangeEmitter.dispose();
  }
}

/**
 * 获取项目检测器实例
 */
export function getProjectDetector(): ProjectDetector {
  return ProjectDetector.getInstance();
}
