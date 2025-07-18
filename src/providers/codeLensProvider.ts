/**
 * CodeLens 提供器
 * 在 Dart 代码中提供内联翻译预览
 */

import * as vscode from 'vscode';
import { getDartParser } from '../core/dartParser';
import { getArbManager } from '../core/arbManager';
import { getProjectDetector } from '../core/projectDetector';
import { I18nReference, TranslationStatus } from '../types';

export class I18nCodeLensProvider implements vscode.CodeLensProvider {
  private codeLensEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this.codeLensEmitter.event;

  constructor() {
    console.log('🔌 [CodeLens] CodeLens provider constructor called');

    // 延迟设置事件监听，确保实例已初始化
    setTimeout(() => {
      this.setupEventListeners();
    }, 100);
  }

  private setupEventListeners(): void {
    try {
      console.log('👂 [CodeLens] Setting up event listeners...');

      const arbManager = getArbManager();
      const projectDetector = getProjectDetector();

      if (arbManager) {
        console.log('✅ [CodeLens] ARB manager found, setting up file change listener');
        arbManager.onFileChanged(() => {
          console.log('🔄 [CodeLens] ARB file changed, refreshing CodeLens');
          this.refresh();
        });
      } else {
        console.log('❌ [CodeLens] ARB manager not found');
      }

      if (projectDetector) {
        console.log('✅ [CodeLens] Project detector found, setting up config change listener');
        projectDetector.onConfigChanged(() => {
          console.log('🔄 [CodeLens] Project config changed, refreshing CodeLens');
          this.refresh();
        });
      } else {
        console.log('❌ [CodeLens] Project detector not found');
      }
    } catch (error) {
      console.error('❌ [CodeLens] Error setting up event listeners:', error);
    }
  }

  // 动态获取实例的辅助方法
  protected getDartParser() {
    const parser = getDartParser();
    if (!parser) {
      console.error('❌ [CodeLens] Dart parser not available');
    }
    return parser;
  }

  protected getArbManager() {
    const manager = getArbManager();
    if (!manager) {
      console.error('❌ [CodeLens] ARB manager not available');
    }
    return manager;
  }

  protected getProjectDetector() {
    const detector = getProjectDetector();
    if (!detector) {
      console.error('❌ [CodeLens] Project detector not available');
    }
    return detector;
  }

  /**
   * 提供 CodeLens
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    console.log(`🔍 [CodeLens] ===== provideCodeLenses CALLED =====`);
    console.log(`🔍 [CodeLens] Document: ${document.fileName}`);
    console.log(`🔍 [CodeLens] Language: ${document.languageId}`);
    console.log(`🔍 [CodeLens] URI: ${document.uri.toString()}`);
    console.log(`🔍 [CodeLens] Line count: ${document.lineCount}`);

    // 检查是否为 Dart 文件
    if (document.languageId !== 'dart') {
      console.log('❌ [CodeLens] Not a Dart file, skipping');
      return [];
    }

    // 检查是否启用 CodeLens
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const enableCodeLens = config.get('enableCodeLens', true);
    console.log('🔍 [CodeLens] CodeLens enabled:', enableCodeLens);

    if (!enableCodeLens) {
      console.log('❌ [CodeLens] CodeLens disabled in configuration');
      return [];
    }

    // 动态获取项目检测器
    const projectDetector = this.getProjectDetector();
    if (!projectDetector) {
      console.log('❌ [CodeLens] Project detector not available');
      return [];
    }

    // 检查项目配置
    const projectConfig = projectDetector.getProjectConfig();
    console.log('🔍 [CodeLens] Project config:', projectConfig);

    if (!projectConfig) {
      console.log('❌ [CodeLens] No project configuration found');
      return [];
    }

    // 动态获取Dart解析器
    const dartParser = this.getDartParser();
    if (!dartParser) {
      console.log('❌ [CodeLens] Dart parser not available');
      return [];
    }

    try {
      console.log('🔍 [CodeLens] Parsing document...');
      const parseResult = dartParser.parseDocument(document);
      console.log('🔍 [CodeLens] Parse result:', {
        referencesCount: parseResult.references.length,
        references: parseResult.references.map(ref => ({ key: ref.key, isValid: ref.isValid })),
      });

      const codeLenses: vscode.CodeLens[] = [];

      for (const reference of parseResult.references) {
        console.log(
          '🔍 [CodeLens] Processing reference:',
          reference.key,
          'valid:',
          reference.isValid
        );

        if (!reference.isValid) {
          console.log('⚠️ [CodeLens] Skipping invalid reference:', reference.key);
          continue;
        }

        const codeLens = this.createCodeLens(reference, document);
        if (codeLens) {
          console.log('✅ [CodeLens] Created CodeLens for:', reference.key);
          codeLenses.push(codeLens);
        } else {
          console.log('❌ [CodeLens] Failed to create CodeLens for:', reference.key);
        }
      }

      console.log('🎉 [CodeLens] Returning', codeLenses.length, 'CodeLenses');
      return codeLenses;
    } catch (error) {
      console.error('❌ [CodeLens] Error providing CodeLenses:', error);
      console.error(
        '❌ [CodeLens] Error stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );
      return [];
    }
  }

  /**
   * 解析 CodeLens 命令
   */
  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.CodeLens | Thenable<vscode.CodeLens> {
    // CodeLens 已在 provideCodeLenses 中完全解析
    return codeLens;
  }

  /**
   * 创建 CodeLens
   */
  private createCodeLens(
    reference: I18nReference,
    document: vscode.TextDocument
  ): vscode.CodeLens | null {
    try {
      // 动态获取ARB管理器
      const arbManager = this.getArbManager();
      if (!arbManager) {
        console.error('❌ [CodeLens] ARB manager not available for creating CodeLens');
        return null;
      }

      const translations = arbManager.getAllTranslations(reference.key);
      const status = this.getTranslationStatus(reference.key, translations);

      // 获取预览语言的翻译
      const previewLocale = this.getPreviewLocale();
      const previewTranslation =
        translations.get(previewLocale) ||
        translations.get('en') ||
        translations.values().next().value ||
        '';

      // 创建 CodeLens 范围（在引用上方显示）
      const line = reference.range.start.line;
      const codeLensRange = new vscode.Range(line, 0, line, 0);

      // 创建命令
      const command = this.createCodeLensCommand(
        reference,
        status,
        previewTranslation,
        translations
      );

      return new vscode.CodeLens(codeLensRange, command);
    } catch (error) {
      console.error(`Error creating CodeLens for ${reference.key}:`, error);
      return null;
    }
  }

  /**
   * 创建 CodeLens 命令
   */
  protected createCodeLensCommand(
    reference: I18nReference,
    status: TranslationStatus,
    previewTranslation: string,
    allTranslations: Map<string, string>
  ): vscode.Command {
    const statusIcon = this.getStatusIcon(status);
    const truncatedTranslation = this.truncateText(previewTranslation, 50);

    let title: string;
    let tooltip: string;

    if (status === TranslationStatus.MISSING) {
      title = `🔴 ${statusIcon} [${reference.key}] - No translations found`;
      tooltip = 'Click to add translations';
    } else if (status === TranslationStatus.PARTIAL) {
      const completedCount = allTranslations.size;

      // 动态获取ARB管理器来获取总数
      const arbManager = this.getArbManager();
      const totalCount = arbManager ? arbManager.getArbFiles().size : 0;

      title = `🟡 ${statusIcon} [${reference.key}] - "${truncatedTranslation}" (${completedCount}/${totalCount})`;
      tooltip = `Click to edit translations\n\nCurrent translations:\n${this.formatTranslationsTooltip(allTranslations)}`;
    } else {
      title = `🟢 ${statusIcon} [${reference.key}] - "${truncatedTranslation}"`;
      tooltip = `Click to edit translations\n\nAll translations:\n${this.formatTranslationsTooltip(allTranslations)}`;
    }

    return {
      title,
      tooltip,
      command: 'flutter-i18n-vscode-inline.editTranslation',
      arguments: [reference.key, reference.range],
    };
  }

  /**
   * 获取翻译状态
   */
  protected getTranslationStatus(
    key: string,
    translations: Map<string, string>
  ): TranslationStatus {
    const arbManager = this.getArbManager();
    if (!arbManager) {
      console.error('❌ [CodeLens] ARB manager not available for getting translation status');
      return TranslationStatus.MISSING;
    }

    const totalLocales = arbManager.getArbFiles().size;
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
   * 获取状态图标
   */
  private getStatusIcon(status: TranslationStatus): string {
    switch (status) {
      case TranslationStatus.COMPLETE:
        return '✅';
      case TranslationStatus.PARTIAL:
        return '⚠️';
      case TranslationStatus.MISSING:
        return '❌';
      case TranslationStatus.UNUSED:
        return '🔍';
      default:
        return '❓';
    }
  }

  /**
   * 获取预览语言
   */
  private getPreviewLocale(): string {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const previewLanguage = config.get('previewLanguage', 'en');

    // 动态获取ARB管理器
    const arbManager = this.getArbManager();
    if (!arbManager) {
      console.error('❌ [CodeLens] ARB manager not available for getting preview locale');
      return 'en';
    }

    // 检查预览语言是否存在
    const arbFiles = arbManager.getArbFiles();
    if (arbFiles.has(previewLanguage)) {
      return previewLanguage;
    }

    // 如果预览语言不存在，使用默认语言
    const projectDetector = this.getProjectDetector();
    if (projectDetector) {
      const projectConfig = projectDetector.getProjectConfig();
      if (projectConfig && arbFiles.has(projectConfig.defaultLocale)) {
        return projectConfig.defaultLocale;
      }
    }

    // 最后使用英语或第一个可用语言
    if (arbFiles.has('en')) {
      return 'en';
    }

    const firstLocale = arbFiles.keys().next().value;
    return firstLocale || 'en';
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 格式化翻译工具提示
   */
  private formatTranslationsTooltip(translations: Map<string, string>): string {
    const lines: string[] = [];

    for (const [locale, translation] of translations) {
      const truncated = this.truncateText(translation, 40);
      lines.push(`${locale}: "${truncated}"`);
    }

    return lines.join('\n');
  }

  /**
   * 刷新 CodeLens
   */
  public refresh(): void {
    this.codeLensEmitter.fire();
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.codeLensEmitter.dispose();
  }
}

/**
 * 高级 CodeLens 提供器
 * 提供更多高级功能，如翻译建议、批量操作等
 */
export class AdvancedI18nCodeLensProvider extends I18nCodeLensProvider {
  /**
   * 创建高级 CodeLens 命令
   */
  protected createCodeLensCommand(
    reference: I18nReference,
    status: TranslationStatus,
    previewTranslation: string,
    allTranslations: Map<string, string>
  ): vscode.Command {
    const baseCommand = super.createCodeLensCommand(
      reference,
      status,
      previewTranslation,
      allTranslations
    );

    // 添加右键菜单支持
    const enhancedCommand = {
      ...baseCommand,
      arguments: [
        reference.key,
        reference.range,
        {
          showQuickPick: true,
          enableBatchEdit: true,
          showTranslationSuggestions: true,
        },
      ],
    };

    return enhancedCommand;
  }

  /**
   * 提供额外的 CodeLens（如统计信息）
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    console.log(`🔍 [AdvancedCodeLens] ===== AdvancedI18nCodeLensProvider CALLED =====`);
    console.log(`🔍 [AdvancedCodeLens] Document: ${document.fileName}`);
    const baseLenses = super.provideCodeLenses(document, token);

    if (Array.isArray(baseLenses)) {
      return this.addStatisticsCodeLens(document, baseLenses);
    }

    return baseLenses.then(lenses => this.addStatisticsCodeLens(document, lenses));
  }

  /**
   * 添加统计信息 CodeLens
   */
  private addStatisticsCodeLens(
    document: vscode.TextDocument,
    baseLenses: vscode.CodeLens[]
  ): vscode.CodeLens[] {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    if (!config.get('showTranslationStats', false)) {
      return baseLenses;
    }

    if (baseLenses.length === 0) {
      return baseLenses;
    }

    // 动态获取Dart解析器
    const dartParser = this.getDartParser();
    if (!dartParser) {
      console.error('❌ [CodeLens] Dart parser not available for statistics');
      return baseLenses;
    }

    // 动态获取ARB管理器
    const arbManager = this.getArbManager();
    if (!arbManager) {
      console.error('❌ [CodeLens] ARB manager not available for statistics');
      return baseLenses;
    }

    // 计算统计信息
    const parseResult = dartParser.parseDocument(document);
    const uniqueKeys = new Set(parseResult.references.map(ref => ref.key));
    const totalKeys = uniqueKeys.size;

    let completeCount = 0;
    let partialCount = 0;
    let missingCount = 0;

    for (const key of uniqueKeys) {
      const translations = arbManager.getAllTranslations(key);
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

    // 创建统计 CodeLens
    const statsRange = new vscode.Range(0, 0, 0, 0);
    const statsCommand: vscode.Command = {
      title: `📊 i18n: ${completeCount} complete, ${partialCount} partial, ${missingCount} missing (${totalKeys} total)`,
      tooltip: 'Click to view detailed translation statistics',
      command: 'flutter-i18n-vscode-inline.showStatistics',
      arguments: [document.uri.fsPath],
    };

    const statsCodeLens = new vscode.CodeLens(statsRange, statsCommand);

    return [statsCodeLens, ...baseLenses];
  }
}
