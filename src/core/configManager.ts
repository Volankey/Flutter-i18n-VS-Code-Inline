/**
 * 配置管理器
 * 管理插件的各种配置选项
 */

import * as vscode from 'vscode';
import { PluginConfiguration } from '../types';
import { getCacheManager, CacheKeys, CacheTTL } from './cacheManager';

export class ConfigManager {
  private static instance: ConfigManager;
  private cache = getCacheManager();
  private configChangeEmitter = new vscode.EventEmitter<PluginConfiguration>();

  // 配置变更事件
  public readonly onConfigurationChanged = this.configChangeEmitter.event;

  private constructor() {
    // 监听配置变更
    vscode.workspace.onDidChangeConfiguration(this.handleConfigurationChange.bind(this));
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 获取插件配置
   */
  public getConfiguration(): PluginConfiguration {
    const cached = this.cache.get<PluginConfiguration>(CacheKeys.PLUGIN_CONFIG);
    if (cached) {
      return cached;
    }

    const config = this.loadConfiguration();
    this.cache.set(CacheKeys.PLUGIN_CONFIG, config, CacheTTL.MEDIUM);
    return config;
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): PluginConfiguration {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');

    return {
      // 内联预览配置
      inlinePreview: {
        enabled: config.get('inlinePreview.enabled', true),
        maxLength: config.get('inlinePreview.maxLength', 50),
        showIcon: config.get('inlinePreview.showIcon', true),
        showStatus: config.get('inlinePreview.showStatus', true),
        languages: config.get('inlinePreview.languages', ['en']),
        position: config.get('inlinePreview.position', 'after'),
      },

      // 悬停预览配置
      hoverPreview: {
        enabled: config.get('hoverPreview.enabled', true),
        maxLength: config.get('hoverPreview.maxLength', 200),
        showAllLanguages: config.get('hoverPreview.showAllLanguages', true),
        showMetadata: config.get('hoverPreview.showMetadata', true),
        showActions: config.get('hoverPreview.showActions', true),
        languages: config.get('hoverPreview.languages', []),
      },

      // 诊断配置
      diagnostics: {
        enabled: config.get('diagnostics.enabled', true),
        missingTranslations: config.get('diagnostics.missingTranslations', 'warning'),
        partialTranslations: config.get('diagnostics.partialTranslations', 'info'),
        invalidReferences: config.get('diagnostics.invalidReferences', 'error'),
        parameterMismatch: config.get('diagnostics.parameterMismatch', 'warning'),
        showQuickFixes: config.get('diagnostics.showQuickFixes', true),
      },

      // 自动完成配置
      autoCompletion: {
        enabled: config.get('autoCompletion.enabled', true),
        showExistingKeys: config.get('autoCompletion.showExistingKeys', true),
        showSuggestions: config.get('autoCompletion.showSuggestions', true),
        triggerCharacters: config.get('autoCompletion.triggerCharacters', ['.', '(']),
      },

      // 编辑器配置
      editor: {
        enableQuickEdit: config.get('editor.enableQuickEdit', true),
        enableBulkEdit: config.get('editor.enableBulkEdit', true),
        autoSave: config.get('editor.autoSave', true),
        validateOnSave: config.get('editor.validateOnSave', true),
      },

      // 文件监听配置
      fileWatcher: {
        enabled: config.get('fileWatcher.enabled', true),
        watchArbFiles: config.get('fileWatcher.watchArbFiles', true),
        watchConfigFiles: config.get('fileWatcher.watchConfigFiles', true),
        debounceDelay: config.get('fileWatcher.debounceDelay', 500),
      },

      // 性能配置
      performance: {
        enableCaching: config.get('performance.enableCaching', true),
        cacheTimeout: config.get('performance.cacheTimeout', 300000),
        maxCacheSize: config.get('performance.maxCacheSize', 1000),
        enableLazyLoading: config.get('performance.enableLazyLoading', true),
      },

      // 调试配置
      debug: {
        enabled: config.get('debug.enabled', false),
        logLevel: config.get('debug.logLevel', 'info'),
        showPerformanceMetrics: config.get('debug.showPerformanceMetrics', false),
      },

      // 高级配置
      advanced: {
        customPatterns: config.get('advanced.customPatterns', []),
        excludePatterns: config.get('advanced.excludePatterns', []),
        maxFileSize: config.get('advanced.maxFileSize', 1048576),
        enableExperimentalFeatures: config.get('advanced.enableExperimentalFeatures', false),
      },
    };
  }

  /**
   * 更新配置
   */
  public async updateConfiguration(
    section: string,
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    await config.update(section, value, target);
  }

  /**
   * 重置配置到默认值
   */
  public async resetConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const inspect = config.inspect<any>('');

    if (inspect) {
      // 清除工作区配置
      if (inspect.workspaceValue !== undefined) {
        await config.update('', undefined, vscode.ConfigurationTarget.Workspace);
      }

      // 清除用户配置
      if (inspect.globalValue !== undefined) {
        await config.update('', undefined, vscode.ConfigurationTarget.Global);
      }
    }

    // 清除缓存
    this.cache.delete(CacheKeys.PLUGIN_CONFIG);

    vscode.window.showInformationMessage('Configuration reset to default values');
  }

  /**
   * 导出配置
   */
  public async exportConfiguration(): Promise<void> {
    try {
      const config = this.getConfiguration();
      const configJson = JSON.stringify(config, null, 2);

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('flutter-i18n-config.json'),
        filters: {
          JSON: ['json'],
        },
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(configJson, 'utf8'));
        vscode.window.showInformationMessage(`Configuration exported to ${uri.fsPath}`);
      }
    } catch (error) {
      console.error('Error exporting configuration:', error);
      vscode.window.showErrorMessage(`Failed to export configuration: ${(error as Error).message}`);
    }
  }

  /**
   * 导入配置
   */
  public async importConfiguration(): Promise<void> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
          JSON: ['json'],
        },
      });

      if (!uris || uris.length === 0) {
        return;
      }

      const uri = uris[0];
      const content = await vscode.workspace.fs.readFile(uri);
      const importedConfig = JSON.parse(content.toString()) as PluginConfiguration;

      // 验证配置格式
      if (!this.validateConfiguration(importedConfig)) {
        vscode.window.showErrorMessage('Invalid configuration format');
        return;
      }

      // 应用配置
      await this.applyConfiguration(importedConfig);

      vscode.window.showInformationMessage(`Configuration imported from ${uri.fsPath}`);
    } catch (error) {
      console.error('Error importing configuration:', error);
      vscode.window.showErrorMessage(`Failed to import configuration: ${(error as Error).message}`);
    }
  }

  /**
   * 应用配置
   */
  public async applyConfiguration(config: PluginConfiguration): Promise<void> {
    const vsConfig = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');

    // 内联预览配置
    await vsConfig.update('inlinePreview.enabled', config.inlinePreview.enabled);
    await vsConfig.update('inlinePreview.maxLength', config.inlinePreview.maxLength);
    await vsConfig.update('inlinePreview.showIcon', config.inlinePreview.showIcon);
    await vsConfig.update('inlinePreview.showStatus', config.inlinePreview.showStatus);
    await vsConfig.update('inlinePreview.languages', config.inlinePreview.languages);
    await vsConfig.update('inlinePreview.position', config.inlinePreview.position);

    // 悬停预览配置
    await vsConfig.update('hoverPreview.enabled', config.hoverPreview.enabled);
    await vsConfig.update('hoverPreview.maxLength', config.hoverPreview.maxLength);
    await vsConfig.update('hoverPreview.showAllLanguages', config.hoverPreview.showAllLanguages);
    await vsConfig.update('hoverPreview.showMetadata', config.hoverPreview.showMetadata);
    await vsConfig.update('hoverPreview.showActions', config.hoverPreview.showActions);
    await vsConfig.update('hoverPreview.languages', config.hoverPreview.languages);

    // 诊断配置
    await vsConfig.update('diagnostics.enabled', config.diagnostics.enabled);
    await vsConfig.update(
      'diagnostics.missingTranslations',
      config.diagnostics.missingTranslations
    );
    await vsConfig.update(
      'diagnostics.partialTranslations',
      config.diagnostics.partialTranslations
    );
    await vsConfig.update('diagnostics.invalidReferences', config.diagnostics.invalidReferences);
    await vsConfig.update('diagnostics.parameterMismatch', config.diagnostics.parameterMismatch);
    await vsConfig.update('diagnostics.showQuickFixes', config.diagnostics.showQuickFixes);

    // 其他配置...

    // 清除缓存
    this.cache.delete(CacheKeys.PLUGIN_CONFIG);
  }

  /**
   * 验证配置格式
   */
  public validateConfiguration(config: any): config is PluginConfiguration {
    try {
      return (
        config &&
        typeof config === 'object' &&
        config.inlinePreview &&
        typeof config.inlinePreview === 'object' &&
        config.hoverPreview &&
        typeof config.hoverPreview === 'object' &&
        config.diagnostics &&
        typeof config.diagnostics === 'object'
      );
    } catch {
      return false;
    }
  }

  /**
   * 获取特定配置项
   */
  public get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    return config.get(key, defaultValue as T);
  }

  /**
   * 设置特定配置项
   */
  public async set(
    key: string,
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    await this.updateConfiguration(key, value, target);
  }

  /**
   * 检查配置项是否存在
   */
  public has(key: string): boolean {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const inspect = config.inspect(key);
    return inspect !== undefined;
  }

  /**
   * 获取配置项的详细信息
   */
  public inspect(key: string): vscode.WorkspaceConfiguration | undefined {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    return config.inspect(key) as any;
  }

  /**
   * 清除配置缓存
   */
  public clearCache(): void {
    this.cache.delete(CacheKeys.PLUGIN_CONFIG);
  }

  /**
   * 处理配置变更
   */
  public handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration('flutter-i18n-vscode-inline')) {
      // 清除缓存
      this.clearCache();

      // 触发配置变更事件
      const newConfig = this.getConfiguration();
      this.configChangeEmitter.fire(newConfig);
    }
  }

  /**
   * 显示配置快速选择
   */
  public async showConfigurationQuickPick(): Promise<void> {
    const items: vscode.QuickPickItem[] = [
      {
        label: '$(gear) Open Settings',
        description: 'Open Flutter i18n settings in VS Code',
        detail: 'Configure all plugin options',
      },
      {
        label: '$(export) Export Configuration',
        description: 'Export current configuration to file',
        detail: 'Save your settings for backup or sharing',
      },
      {
        label: '$(import) Import Configuration',
        description: 'Import configuration from file',
        detail: 'Load settings from a previously exported file',
      },
      {
        label: '$(refresh) Reset to Defaults',
        description: 'Reset all settings to default values',
        detail: 'This will clear all custom configurations',
      },
      {
        label: '$(info) Show Current Configuration',
        description: 'Display current configuration values',
        detail: 'View all current settings',
      },
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select configuration action',
    });

    if (!selected) {
      return;
    }

    switch (selected.label) {
      case '$(gear) Open Settings':
        await vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'flutter-i18n-vscode-inline'
        );
        break;

      case '$(export) Export Configuration':
        await this.exportConfiguration();
        break;

      case '$(import) Import Configuration':
        await this.importConfiguration();
        break;

      case '$(refresh) Reset to Defaults':
        const confirm = await vscode.window.showWarningMessage(
          'Are you sure you want to reset all settings to default values?',
          'Reset',
          'Cancel'
        );
        if (confirm === 'Reset') {
          await this.resetConfiguration();
        }
        break;

      case '$(info) Show Current Configuration':
        await this.showCurrentConfiguration();
        break;
    }
  }

  /**
   * 显示当前配置
   */
  private async showCurrentConfiguration(): Promise<void> {
    const config = this.getConfiguration();
    const configJson = JSON.stringify(config, null, 2);

    const doc = await vscode.workspace.openTextDocument({
      content: configJson,
      language: 'json',
    });

    await vscode.window.showTextDocument(doc);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.configChangeEmitter.dispose();
  }
}

// 导出单例实例
export const getConfigManager = (): ConfigManager => ConfigManager.getInstance();

// 配置常量
export const ConfigDefaults = {
  INLINE_PREVIEW_MAX_LENGTH: 50,
  HOVER_PREVIEW_MAX_LENGTH: 200,
  CACHE_TIMEOUT: 300000, // 5分钟
  DEBOUNCE_DELAY: 500,
  MAX_FILE_SIZE: 1048576, // 1MB
  MAX_CACHE_SIZE: 1000,
} as const;

// 配置验证器
export class ConfigValidator {
  /**
   * 验证数字范围
   */
  static validateNumberRange(value: number, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * 验证字符串数组
   */
  static validateStringArray(value: any): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
  }

  /**
   * 验证诊断严重性
   */
  static validateDiagnosticSeverity(value: any): boolean {
    return ['error', 'warning', 'info', 'hint'].includes(value);
  }

  /**
   * 验证日志级别
   */
  static validateLogLevel(value: any): boolean {
    return ['error', 'warn', 'info', 'debug'].includes(value);
  }
}
