/**
 * 翻译编辑器
 * 提供可视化的翻译编辑界面
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getArbManager } from '../core/arbManager';
import { getProjectDetector } from '../core/projectDetector';
import { TranslationEditRequest, TranslationEditResult, ArbEntry } from '../types';

export class TranslationEditorProvider implements vscode.CustomTextEditorProvider {
  private arbManager = getArbManager();
  private projectDetector = getProjectDetector();

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new TranslationEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      TranslationEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  public static readonly viewType = 'flutter-i18n-vscode-inline.translationEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * 解析自定义文档
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    // 设置 webview 选项
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // 设置 webview 内容
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // 处理来自 webview 的消息
    webviewPanel.webview.onDidReceiveMessage(
      message => this.handleWebviewMessage(message, document, webviewPanel),
      undefined,
      this.context.subscriptions
    );

    // 监听文档变化
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(webviewPanel, document);
      }
    });

    // 当 webview 被销毁时清理
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // 初始化 webview 数据
    this.updateWebview(webviewPanel, document);
  }

  /**
   * 处理 webview 消息
   */
  private async handleWebviewMessage(
    message: any,
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    switch (message.type) {
      case 'ready':
        // webview 准备就绪，发送初始数据
        this.updateWebview(webviewPanel, document);
        break;

      case 'updateTranslation':
        await this.handleUpdateTranslation(message.data, document);
        break;

      case 'createTranslation':
        await this.handleCreateTranslation(message.data, document);
        break;

      case 'deleteTranslation':
        await this.handleDeleteTranslation(message.data, document);
        break;

      case 'exportTranslations':
        await this.handleExportTranslations(message.data);
        break;

      case 'importTranslations':
        await this.handleImportTranslations(message.data, document);
        break;

      case 'validateTranslations':
        await this.handleValidateTranslations(webviewPanel);
        break;
    }
  }

  /**
   * 更新 webview 内容
   */
  private updateWebview(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument): void {
    try {
      const projectConfig = this.projectDetector.getProjectConfig();
      if (!projectConfig) {
        webviewPanel.webview.postMessage({
          type: 'error',
          message: 'No Flutter project configuration found',
        });
        return;
      }

      // 获取所有翻译数据
      const translationData = this.getTranslationData();

      webviewPanel.webview.postMessage({
        type: 'updateData',
        data: {
          translations: translationData,
          locales: Array.from(this.arbManager.getArbFiles().keys()),
          defaultLocale: projectConfig.defaultLocale,
          projectConfig,
        },
      });
    } catch (error) {
      console.error('Error updating webview:', error);
      webviewPanel.webview.postMessage({
        type: 'error',
        message: `Error loading translations: ${(error as Error).message}`,
      });
    }
  }

  /**
   * 获取翻译数据
   */
  private getTranslationData(): any {
    const allKeys = this.arbManager.getAllKeysArray();
    const locales = Array.from(this.arbManager.getArbFiles().keys());
    const translations: any = {};

    for (const key of allKeys) {
      translations[key] = {
        key,
        values: {},
        metadata: {},
        status: 'complete',
      };

      let completedCount = 0;

      for (const locale of locales) {
        const entry = this.arbManager.getTranslation(key, locale);
        if (entry) {
          translations[key].values[locale] = entry;
          completedCount++;
        } else {
          translations[key].values[locale] = '';
        }
      }

      // 计算状态
      if (completedCount === 0) {
        translations[key].status = 'missing';
      } else if (completedCount < locales.length) {
        translations[key].status = 'partial';
      } else {
        translations[key].status = 'complete';
      }
    }

    return translations;
  }

  /**
   * 处理更新翻译
   */
  private async handleUpdateTranslation(
    data: { key: string; locale: string; value: string; description?: string },
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      await this.arbManager.setTranslation(data.key, data.locale, data.value, data.description);

      // 保存文件
      await this.arbManager.saveArbFileByLocale(data.locale);

      vscode.window.showInformationMessage(`Translation updated: ${data.key} (${data.locale})`);
    } catch (error) {
      console.error('Error updating translation:', error);
      vscode.window.showErrorMessage(`Failed to update translation: ${(error as Error).message}`);
    }
  }

  /**
   * 处理创建翻译
   */
  private async handleCreateTranslation(
    data: { key: string; values: { [locale: string]: string }; description?: string },
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      for (const [locale, value] of Object.entries(data.values)) {
        if (value.trim()) {
          await this.arbManager.setTranslation(data.key, locale, value, data.description);
        }
      }

      // 保存所有修改的文件
      const locales = Object.keys(data.values).filter(locale => data.values[locale].trim());
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }

      vscode.window.showInformationMessage(`Translation created: ${data.key}`);
    } catch (error) {
      console.error('Error creating translation:', error);
      vscode.window.showErrorMessage(`Failed to create translation: ${(error as Error).message}`);
    }
  }

  /**
   * 处理删除翻译
   */
  private async handleDeleteTranslation(
    data: { key: string },
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      const locales = Array.from(this.arbManager.getArbFiles().keys());

      for (const locale of locales) {
        await this.arbManager.deleteTranslation(locale, data.key);
      }

      // 保存所有文件
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }

      vscode.window.showInformationMessage(`Translation deleted: ${data.key}`);
    } catch (error) {
      console.error('Error deleting translation:', error);
      vscode.window.showErrorMessage(`Failed to delete translation: ${(error as Error).message}`);
    }
  }

  /**
   * 处理导出翻译
   */
  private async handleExportTranslations(data: { format: string; locale?: string }): Promise<void> {
    try {
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`translations.${data.format}`),
        filters: {
          JSON: ['json'],
          CSV: ['csv'],
          Excel: ['xlsx'],
        },
      });

      if (!uri) {
        return;
      }

      // 这里可以实现不同格式的导出逻辑
      // 目前简单实现 JSON 导出
      if (data.format === 'json') {
        const translationData = this.getTranslationData();
        const jsonContent = JSON.stringify(translationData, null, 2);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
      }

      vscode.window.showInformationMessage(`Translations exported to ${uri.fsPath}`);
    } catch (error) {
      console.error('Error exporting translations:', error);
      vscode.window.showErrorMessage(`Failed to export translations: ${(error as Error).message}`);
    }
  }

  /**
   * 处理导入翻译
   */
  private async handleImportTranslations(
    data: { format: string },
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
          JSON: ['json'],
          CSV: ['csv'],
          Excel: ['xlsx'],
        },
      });

      if (!uris || uris.length === 0) {
        return;
      }

      const uri = uris[0];
      const content = await vscode.workspace.fs.readFile(uri);

      // 这里可以实现不同格式的导入逻辑
      // 目前简单实现 JSON 导入
      if (data.format === 'json') {
        const importedData = JSON.parse(content.toString());

        for (const [key, translationData] of Object.entries(importedData as any)) {
          const data = translationData as any;
          for (const [locale, value] of Object.entries(data.values as any)) {
            if (value && typeof value === 'string') {
              await this.arbManager.setTranslation(key, locale, value);
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
  }

  /**
   * 处理验证翻译
   */
  private async handleValidateTranslations(webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      const validationResults = this.validateAllTranslations();

      webviewPanel.webview.postMessage({
        type: 'validationResults',
        data: validationResults,
      });
    } catch (error) {
      console.error('Error validating translations:', error);
      webviewPanel.webview.postMessage({
        type: 'error',
        message: `Validation failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * 验证所有翻译
   */
  private validateAllTranslations(): any {
    const allKeys = this.arbManager.getAllKeysArray();
    const locales = Array.from(this.arbManager.getArbFiles().keys());
    const issues: any[] = [];

    for (const key of allKeys) {
      const translations = this.arbManager.getAllTranslations(key);

      // 检查缺失翻译
      const missingLocales = locales.filter(locale => !translations.has(locale));
      if (missingLocales.length > 0) {
        issues.push({
          type: 'missing',
          key,
          locales: missingLocales,
          message: `Missing translations in: ${missingLocales.join(', ')}`,
        });
      }

      // 检查空翻译
      for (const [locale, translation] of translations) {
        if (!translation.trim()) {
          issues.push({
            type: 'empty',
            key,
            locale,
            message: `Empty translation for ${locale}`,
          });
        }
      }

      // 检查参数一致性
      const parameterIssues = this.validateParameters(key, translations);
      issues.push(...parameterIssues);
    }

    return {
      totalKeys: allKeys.length,
      totalIssues: issues.length,
      issues,
    };
  }

  /**
   * 验证参数一致性
   */
  private validateParameters(key: string, translations: Map<string, string>): any[] {
    const issues: any[] = [];
    const parameterPattern = /\{([^}]+)\}/g;

    // 获取所有翻译中的参数
    const allParameters = new Set<string>();
    const localeParameters = new Map<string, Set<string>>();

    for (const [locale, translation] of translations) {
      const parameters = new Set<string>();
      let match;

      while ((match = parameterPattern.exec(translation)) !== null) {
        const param = match[1];
        parameters.add(param);
        allParameters.add(param);
      }

      localeParameters.set(locale, parameters);
    }

    // 检查参数一致性
    for (const [locale, parameters] of localeParameters) {
      const missingParams = Array.from(allParameters).filter(p => !parameters.has(p));
      const extraParams = Array.from(parameters).filter(p => !allParameters.has(p));

      if (missingParams.length > 0) {
        issues.push({
          type: 'missing-parameters',
          key,
          locale,
          parameters: missingParams,
          message: `Missing parameters in ${locale}: ${missingParams.join(', ')}`,
        });
      }

      if (extraParams.length > 0) {
        issues.push({
          type: 'extra-parameters',
          key,
          locale,
          parameters: extraParams,
          message: `Extra parameters in ${locale}: ${extraParams.join(', ')}`,
        });
      }
    }

    return issues;
  }

  /**
   * 获取 webview HTML 内容
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // 获取资源 URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'translationEditor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'translationEditor.css')
    );

    // 生成 nonce 用于安全
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Translation Editor</title>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>🌐 Translation Editor</h1>
            <div class="toolbar">
                <button id="addTranslationBtn" class="btn btn-primary">➕ Add Translation</button>
                <button id="validateBtn" class="btn btn-secondary">✅ Validate</button>
                <button id="exportBtn" class="btn btn-secondary">📤 Export</button>
                <button id="importBtn" class="btn btn-secondary">📥 Import</button>
            </div>
        </div>
        
        <div class="filters">
            <input type="text" id="searchInput" placeholder="🔍 Search translations..." class="search-input">
            <select id="statusFilter" class="filter-select">
                <option value="all">All Status</option>
                <option value="complete">Complete</option>
                <option value="partial">Partial</option>
                <option value="missing">Missing</option>
            </select>
            <select id="localeFilter" class="filter-select">
                <option value="all">All Locales</option>
            </select>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-item">
                <span class="stat-label">Total Keys:</span>
                <span class="stat-value" id="totalKeys">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Complete:</span>
                <span class="stat-value" id="completeKeys">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Partial:</span>
                <span class="stat-value" id="partialKeys">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Missing:</span>
                <span class="stat-value" id="missingKeys">0</span>
            </div>
        </div>
        
        <div class="content">
            <div id="translationList" class="translation-list">
                <div class="loading">Loading translations...</div>
            </div>
        </div>
        
        <div id="validationModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Validation Results</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="validationResults">
                </div>
            </div>
        </div>
    </div>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * 生成随机 nonce
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    // TranslationEditorProvider 没有需要特别清理的资源
    // webview 的清理由 VS Code 自动处理
  }
}

/**
 * 快速翻译编辑器
 * 提供快速编辑单个翻译键的界面
 */
export class QuickTranslationEditor {
  private arbManager = getArbManager();
  private projectDetector = getProjectDetector();

  /**
   * 显示快速编辑对话框
   */
  public async showQuickEdit(
    key: string,
    range?: vscode.Range
  ): Promise<TranslationEditResult | null> {
    const projectConfig = this.projectDetector.getProjectConfig();
    if (!projectConfig) {
      vscode.window.showErrorMessage('No Flutter project configuration found');
      return null;
    }

    const locales = Array.from(this.arbManager.getArbFiles().keys());
    const currentTranslations = this.arbManager.getAllTranslations(key);

    // 创建输入框
    const items: vscode.QuickPickItem[] = [];

    for (const locale of locales) {
      const currentValue = currentTranslations.get(locale) || '';
      const status = currentValue ? '✅' : '❌';

      items.push({
        label: `${status} ${locale}`,
        description: currentValue || 'No translation',
        detail: this.getLocaleName(locale),
      });
    }

    // 添加操作项
    items.push({
      label: '$(trash) Delete Translation Key',
      description: 'Remove this translation key',
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Edit translations for: ${key}`,
      matchOnDescription: true,
    });

    if (!selected) {
      return null;
    }

    // 处理选择
    if (selected.label.includes('Delete Translation Key')) {
      return this.handleDeleteTranslationKey(key);
    } else {
      // 编辑特定语言的翻译
      const locale = selected.label.split(' ')[1];
      return this.handleEditSingleTranslation(key, locale);
    }
  }

  /**
   * 处理删除翻译键
   */
  private async handleDeleteTranslationKey(key: string): Promise<TranslationEditResult | null> {
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete the translation key '${key}'? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (confirmation !== 'Delete') {
      return null;
    }

    try {
      const locales = Array.from(this.arbManager.getArbFiles().keys());

      for (const locale of locales) {
        await this.arbManager.deleteTranslation(locale, key);
      }

      // 保存所有文件
      for (const locale of locales) {
        await this.arbManager.saveArbFileByLocale(locale);
      }

      vscode.window.showInformationMessage(`Translation key '${key}' deleted successfully`);

      return {
        success: true,
        key,
        changes: new Map(),
        updatedLocales: locales,
      };
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete translation: ${(error as Error).message}`);
      return {
        success: false,
        key,
        changes: new Map(),
        updatedLocales: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 处理编辑单个翻译
   */
  private async handleEditSingleTranslation(
    key: string,
    locale: string
  ): Promise<TranslationEditResult | null> {
    const currentValue = this.arbManager.getAllTranslations(key).get(locale) || '';

    const newValue = await vscode.window.showInputBox({
      prompt: `Edit translation for '${key}' in ${locale}`,
      value: currentValue,
      validateInput: value => {
        if (!value || !value.trim()) {
          return 'Translation cannot be empty';
        }
        return null;
      },
    });

    if (newValue === undefined) {
      return null;
    }

    try {
      await this.arbManager.setTranslation(key, locale, newValue);
      await this.arbManager.saveArbFileByLocale(locale);

      vscode.window.showInformationMessage(`Translation updated: ${key} (${locale})`);

      return {
        success: true,
        key,
        changes: new Map([[locale, newValue]]),
        updatedLocales: [locale],
      };
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update translation: ${(error as Error).message}`);
      return {
        success: false,
        key,
        changes: new Map(),
        updatedLocales: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取语言名称
   */
  private getLocaleName(locale: string): string {
    const nameMap: { [key: string]: string } = {
      en: 'English',
      zh: 'Chinese',
      zh_CN: 'Chinese (Simplified)',
      zh_TW: 'Chinese (Traditional)',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ja: 'Japanese',
      ko: 'Korean',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ar: 'Arabic',
    };

    return nameMap[locale] || locale.toUpperCase();
  }
}
