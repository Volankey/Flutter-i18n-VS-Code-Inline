/**
 * 诊断提供器
 * 检测缺失翻译并提供快速修复建议
 */

import * as vscode from 'vscode';
import { getDartParser } from '../core/dartParser';
import { getArbManager } from '../core/arbManager';
import { getProjectDetector } from '../core/projectDetector';
import { 
  I18nReference, 
  TranslationStatus, 
  I18nDiagnostic, 
  I18nDiagnosticType, 
  QuickFix,
  ArbEntry
} from '../types';

export class I18nDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private dartParser = getDartParser();
  private arbManager = getArbManager();
  private projectDetector = getProjectDetector();
  
  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('flutter-i18n');
    
    // 监听文档变化
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this);
    vscode.workspace.onDidOpenTextDocument(this.onDocumentOpened, this);
    vscode.workspace.onDidCloseTextDocument(this.onDocumentClosed, this);
    
    // 监听 ARB 文件变化
    this.arbManager.onFileChanged(() => {
      this.refreshAllDiagnostics();
    });
    
    // 监听项目配置变化
    this.projectDetector.onConfigChanged(() => {
      this.refreshAllDiagnostics();
    });
  }

  /**
   * 文档变化处理
   */
  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    if (event.document.languageId === 'dart') {
      // 延迟更新诊断，避免频繁更新
      this.debounceUpdateDiagnostics(event.document);
    }
  }

  /**
   * 文档打开处理
   */
  private onDocumentOpened(document: vscode.TextDocument): void {
    if (document.languageId === 'dart') {
      this.updateDiagnostics(document);
    }
  }

  /**
   * 文档关闭处理
   */
  private onDocumentClosed(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * 防抖更新诊断
   */
  private debounceTimer: NodeJS.Timeout | undefined;
  private debounceUpdateDiagnostics(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.updateDiagnostics(document);
    }, 500); // 500ms 延迟
  }

  /**
   * 更新文档诊断
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    // 检查是否启用诊断
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    if (!config.get('enableDiagnostics', true)) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    // 检查项目配置
    const projectConfig = this.projectDetector.getProjectConfig();
    if (!projectConfig) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    try {
      const diagnostics = this.analyzeDartDocument(document);
      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      console.error('Error updating diagnostics:', error);
      this.diagnosticCollection.delete(document.uri);
    }
  }

  /**
   * 分析 Dart 文档
   */
  private analyzeDartDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
    const parseResult = this.dartParser.parseDocument(document);
    const diagnostics: vscode.Diagnostic[] = [];
    
    for (const reference of parseResult.references) {
      const referenceDiagnostics = this.analyzeReference(reference, document);
      diagnostics.push(...referenceDiagnostics);
    }
    
    // 添加解析错误诊断
    for (const error of parseResult.errors) {
      const diagnostic = this.createParseErrorDiagnostic(error, document);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }
    
    return diagnostics;
  }

  /**
   * 分析引用
   */
  private analyzeReference(reference: I18nReference, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    
    // 检查引用有效性
    if (!reference.isValid) {
      const diagnostic = this.createInvalidReferenceDiagnostic(reference, document);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
      return diagnostics;
    }
    
    // 检查翻译状态
    const translations = this.arbManager.getAllTranslations(reference.key);
    const status = this.getTranslationStatus(reference.key, translations);
    
    switch (status) {
      case TranslationStatus.MISSING:
        const missingDiagnostic = this.createMissingTranslationDiagnostic(reference, document);
        if (missingDiagnostic) {
          diagnostics.push(missingDiagnostic);
        }
        break;
        
      case TranslationStatus.PARTIAL:
        const partialDiagnostic = this.createPartialTranslationDiagnostic(reference, document, translations);
        if (partialDiagnostic) {
          diagnostics.push(partialDiagnostic);
        }
        break;
    }
    
    // 检查参数匹配
    const parameterDiagnostics = this.analyzeParameters(reference, document);
    diagnostics.push(...parameterDiagnostics);
    
    return diagnostics;
  }

  /**
   * 创建无效引用诊断
   */
  private createInvalidReferenceDiagnostic(
    reference: I18nReference, 
    document: vscode.TextDocument
  ): vscode.Diagnostic | null {
    const diagnostic = new vscode.Diagnostic(
      reference.range,
      `Invalid i18n reference: ${reference.key}`,
      vscode.DiagnosticSeverity.Error
    );
    
    diagnostic.source = 'flutter-i18n';
    diagnostic.code = 'invalid-reference';
    
    return diagnostic;
  }

  /**
   * 创建缺失翻译诊断
   */
  private createMissingTranslationDiagnostic(
    reference: I18nReference, 
    document: vscode.TextDocument
  ): vscode.Diagnostic | null {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const severity = config.get('missingTranslationSeverity', 'Warning') as string;
    
    const diagnostic = new vscode.Diagnostic(
      reference.range,
      `Translation key '${reference.key}' not found in any ARB files`,
      this.getSeverityFromString(severity)
    );
    
    diagnostic.source = 'flutter-i18n';
    diagnostic.code = 'missing-translation';
    
    // 添加快速修复
    const quickFixes = this.createMissingTranslationQuickFixes(reference);
    if (quickFixes.length > 0) {
      diagnostic.relatedInformation = quickFixes.map(fix => 
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(document.uri, reference.range),
          fix.title
        )
      );
    }
    
    return diagnostic;
  }

  /**
   * 创建部分翻译诊断
   */
  private createPartialTranslationDiagnostic(
    reference: I18nReference, 
    document: vscode.TextDocument,
    translations: Map<string, string>
  ): vscode.Diagnostic | null {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const severity = config.get('partialTranslationSeverity', 'Information') as string;
    
    const totalLocales = this.arbManager.getArbFiles().size;
    const translatedLocales = translations.size;
    const missingCount = totalLocales - translatedLocales;
    
    const diagnostic = new vscode.Diagnostic(
      reference.range,
      `Translation key '${reference.key}' is missing in ${missingCount} language(s) (${translatedLocales}/${totalLocales} completed)`,
      this.getSeverityFromString(severity)
    );
    
    diagnostic.source = 'flutter-i18n';
    diagnostic.code = 'partial-translation';
    
    // 添加缺失语言信息
    const missingLocales = this.getMissingLocales(translations);
    if (missingLocales.length > 0) {
      diagnostic.relatedInformation = [
        new vscode.DiagnosticRelatedInformation(
          new vscode.Location(document.uri, reference.range),
          `Missing in: ${missingLocales.join(', ')}`
        )
      ];
    }
    
    return diagnostic;
  }

  /**
   * 创建解析错误诊断
   */
  private createParseErrorDiagnostic(
    error: any, 
    document: vscode.TextDocument
  ): vscode.Diagnostic | null {
    if (!error.range) {
      return null;
    }
    
    const diagnostic = new vscode.Diagnostic(
      error.range,
      error.message || 'Parse error',
      vscode.DiagnosticSeverity.Error
    );
    
    diagnostic.source = 'flutter-i18n';
    diagnostic.code = 'parse-error';
    
    return diagnostic;
  }

  /**
   * 分析参数
   */
  private analyzeParameters(reference: I18nReference, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    
    if (!reference.parameters || reference.parameters.length === 0) {
      return diagnostics;
    }
    
    // 获取 ARB 文件中的参数定义
    const defaultLocale = this.arbManager.getDefaultLocale();
    const arbEntry = this.getArbEntry(reference.key);
    
    if (!arbEntry || !arbEntry.placeholders) {
      return diagnostics;
    }
    
    const arbPlaceholders = Object.keys(arbEntry.placeholders);
    const referencePlaceholders = reference.parameters || [];
    
    // 检查缺失参数
    for (const arbParam of arbPlaceholders) {
      if (!referencePlaceholders.includes(arbParam)) {
        const diagnostic = new vscode.Diagnostic(
          reference.range,
          `Missing parameter '${arbParam}' required by translation`,
          vscode.DiagnosticSeverity.Warning
        );
        
        diagnostic.source = 'flutter-i18n';
        diagnostic.code = 'missing-parameter';
        diagnostics.push(diagnostic);
      }
    }
    
    // 检查多余参数
    for (const refParam of referencePlaceholders) {
      if (!arbPlaceholders.includes(refParam)) {
        const diagnostic = new vscode.Diagnostic(
          reference.range,
          `Unknown parameter '${refParam}' not defined in translation`,
          vscode.DiagnosticSeverity.Information
        );
        
        diagnostic.source = 'flutter-i18n';
        diagnostic.code = 'unknown-parameter';
        diagnostics.push(diagnostic);
      }
    }
    
    return diagnostics;
  }

  /**
   * 获取 ARB 条目
   */
  private getArbEntry(key: string): ArbEntry | undefined {
    // 首先尝试从英文 ARB 文件获取
    const enArbFile = this.arbManager.getArbFile('en');
    if (enArbFile && enArbFile.entries.has(key)) {
      return enArbFile.entries.get(key);
    }

    // 如果英文文件中没有，尝试从默认语言获取
    const defaultLocale = this.arbManager.getDefaultLocale();
    const defaultArbFile = this.arbManager.getArbFile(defaultLocale);
    if (defaultArbFile && defaultArbFile.entries.has(key)) {
      return defaultArbFile.entries.get(key);
    }

    return undefined;
  }

  /**
   * 创建缺失翻译快速修复
   */
  private createMissingTranslationQuickFixes(reference: I18nReference): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    
    // 创建翻译键
    quickFixes.push({
      title: `Create translation key '${reference.key}'`,
      kind: vscode.CodeActionKind.QuickFix,
      action: async () => {
        await vscode.commands.executeCommand(
          'flutter-i18n-vscode-inline.createTranslation',
          reference.key,
          reference.range
        );
      }
    });
    
    // 查找相似键
    const similarKeys = this.findSimilarKeys(reference.key);
    for (const similarKey of similarKeys.slice(0, 3)) {
      quickFixes.push({
        title: `Did you mean '${similarKey}'?`,
        kind: vscode.CodeActionKind.QuickFix,
        action: async () => {
          await vscode.commands.executeCommand(
            'flutter-i18n-vscode-inline.replaceKey',
            reference.key,
            similarKey,
            reference.range
          );
        }
      });
    }
    
    return quickFixes;
  }

  /**
   * 查找相似键
   */
  private findSimilarKeys(key: string): string[] {
    const allKeys = this.arbManager.getAllKeysArray();
    const similarities: { key: string; score: number }[] = [];
    
    for (const existingKey of allKeys) {
      const score = this.calculateSimilarity(key, existingKey);
      if (score > 0.6) { // 相似度阈值
        similarities.push({ key: existingKey, score });
      }
    }
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .map(s => s.key);
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

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
   * 获取缺失的语言区域
   */
  private getMissingLocales(translations: Map<string, string>): string[] {
    const allLocales = Array.from(this.arbManager.getArbFiles().keys());
    const translatedLocales = Array.from(translations.keys());
    
    return allLocales.filter(locale => !translatedLocales.includes(locale));
  }

  /**
   * 从字符串获取严重性
   */
  private getSeverityFromString(severity: string): vscode.DiagnosticSeverity {
    switch (severity.toLowerCase()) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'information':
        return vscode.DiagnosticSeverity.Information;
      case 'hint':
        return vscode.DiagnosticSeverity.Hint;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  /**
   * 刷新所有诊断
   */
  public refreshAllDiagnostics(): void {
    // 清除所有现有诊断
    this.diagnosticCollection.clear();
    
    // 重新分析所有打开的 Dart 文档
    for (const document of vscode.workspace.textDocuments) {
      if (document.languageId === 'dart') {
        this.updateDiagnostics(document);
      }
    }
  }

  /**
   * 刷新所有诊断（别名方法）
   */
  public refreshAll(): void {
    this.refreshAllDiagnostics();
  }

  /**
   * 刷新指定文档的诊断
   */
  public refreshDocument(uri: vscode.Uri): void {
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (document && document.languageId === 'dart') {
      this.updateDiagnostics(document);
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  /**
   * 获取诊断统计
   */
  public getDiagnosticStats(): {
    total: number;
    errors: number;
    warnings: number;
    information: number;
    hints: number;
  } {
    let total = 0;
    let errors = 0;
    let warnings = 0;
    let information = 0;
    let hints = 0;
    
    this.diagnosticCollection.forEach((uri, diagnostics) => {
      total += diagnostics.length;
      
      for (const diagnostic of diagnostics) {
        switch (diagnostic.severity) {
          case vscode.DiagnosticSeverity.Error:
            errors++;
            break;
          case vscode.DiagnosticSeverity.Warning:
            warnings++;
            break;
          case vscode.DiagnosticSeverity.Information:
            information++;
            break;
          case vscode.DiagnosticSeverity.Hint:
            hints++;
            break;
        }
      }
    });
    
    return { total, errors, warnings, information, hints };
  }


}

/**
 * 代码操作提供器
 * 为诊断提供快速修复
 */
export class I18nCodeActionProvider implements vscode.CodeActionProvider {
  private dartParser = getDartParser();
  private arbManager = getArbManager();
  
  /**
   * 提供代码操作
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    // 处理诊断相关的快速修复
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source === 'flutter-i18n') {
        const diagnosticActions = this.createActionsForDiagnostic(diagnostic, document, range);
        actions.push(...diagnosticActions);
      }
    }
    
    // 添加通用操作
    const generalActions = this.createGeneralActions(document, range);
    actions.push(...generalActions);
    
    return actions;
  }

  /**
   * 为诊断创建操作
   */
  private createActionsForDiagnostic(
    diagnostic: vscode.Diagnostic,
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    switch (diagnostic.code) {
      case 'missing-translation':
        actions.push(...this.createMissingTranslationActions(diagnostic, document, range));
        break;
        
      case 'partial-translation':
        actions.push(...this.createPartialTranslationActions(diagnostic, document, range));
        break;
        
      case 'invalid-reference':
        actions.push(...this.createInvalidReferenceActions(diagnostic, document, range));
        break;
    }
    
    return actions;
  }

  /**
   * 创建缺失翻译操作
   */
  private createMissingTranslationActions(
    diagnostic: vscode.Diagnostic,
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    // 提取键名
    const keyMatch = diagnostic.message.match(/'([^']+)'/);
    if (!keyMatch) {
      return actions;
    }
    
    const key = keyMatch[1];
    
    // 创建翻译
    const createAction = new vscode.CodeAction(
      `Create translation for '${key}'`,
      vscode.CodeActionKind.QuickFix
    );
    createAction.command = {
      title: 'Create Translation',
      command: 'flutter-i18n-vscode-inline.createTranslation',
      arguments: [key]
    };
    createAction.diagnostics = [diagnostic];
    actions.push(createAction);
    
    // 查找相似键
    const similarKeys = this.findSimilarKeys(key);
    for (const similarKey of similarKeys.slice(0, 3)) {
      const replaceAction = new vscode.CodeAction(
        `Replace with '${similarKey}'`,
        vscode.CodeActionKind.QuickFix
      );
      replaceAction.edit = new vscode.WorkspaceEdit();
      replaceAction.edit.replace(document.uri, diagnostic.range, similarKey);
      replaceAction.diagnostics = [diagnostic];
      actions.push(replaceAction);
    }
    
    return actions;
  }

  /**
   * 创建部分翻译操作
   */
  private createPartialTranslationActions(
    diagnostic: vscode.Diagnostic,
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    // 提取键名
    const keyMatch = diagnostic.message.match(/'([^']+)'/);
    if (!keyMatch) {
      return actions;
    }
    
    const key = keyMatch[1];
    
    // 编辑翻译
    const editAction = new vscode.CodeAction(
      `Complete translations for '${key}'`,
      vscode.CodeActionKind.QuickFix
    );
    editAction.command = {
      title: 'Edit Translation',
      command: 'flutter-i18n-vscode-inline.editTranslation',
      arguments: [key]
    };
    editAction.diagnostics = [diagnostic];
    actions.push(editAction);
    
    return actions;
  }

  /**
   * 创建无效引用操作
   */
  private createInvalidReferenceActions(
    diagnostic: vscode.Diagnostic,
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    // 删除无效引用
    const removeAction = new vscode.CodeAction(
      'Remove invalid reference',
      vscode.CodeActionKind.QuickFix
    );
    removeAction.edit = new vscode.WorkspaceEdit();
    removeAction.edit.delete(document.uri, diagnostic.range);
    removeAction.diagnostics = [diagnostic];
    actions.push(removeAction);
    
    return actions;
  }

  /**
   * 创建通用操作
   */
  private createGeneralActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    // 检查当前位置是否有 i18n 引用
    const reference = this.dartParser.getReferenceAtPosition(document, range.start);
    if (reference && reference.isValid) {
      // 编辑翻译
      const editAction = new vscode.CodeAction(
        `Edit translations for '${reference.key}'`,
        vscode.CodeActionKind.Refactor
      );
      editAction.command = {
        title: 'Edit Translation',
        command: 'flutter-i18n-vscode-inline.editTranslation',
        arguments: [reference.key]
      };
      actions.push(editAction);
      
      // 查找用法
      const findAction = new vscode.CodeAction(
        `Find usages of '${reference.key}'`,
        vscode.CodeActionKind.Refactor
      );
      findAction.command = {
        title: 'Find Usages',
        command: 'flutter-i18n-vscode-inline.findUsages',
        arguments: [reference.key]
      };
      actions.push(findAction);
    }
    
    return actions;
  }

  /**
   * 查找相似键
   */
  private findSimilarKeys(key: string): string[] {
    const allKeys = this.arbManager.getAllKeysArray();
    const similarities: { key: string; score: number }[] = [];
    
    for (const existingKey of allKeys) {
      const score = this.calculateSimilarity(key, existingKey);
      if (score > 0.6) {
        similarities.push({ key: existingKey, score });
      }
    }
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .map(s => s.key);
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}