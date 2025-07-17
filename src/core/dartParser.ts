/**
 * Dart 代码解析器
 * 负责解析 Dart 代码中的 i18n 键引用
 */

import * as vscode from 'vscode';
import { I18nReference, I18nPatternType, DartParseResult, ParseError } from '../types';

export class DartParser {
  private static instance: DartParser;
  private cache = new Map<string, DartParseResult>();
  
  // 默认 i18n 模式的正则表达式
  private readonly defaultPatterns: Partial<Record<I18nPatternType, RegExp>> = {
    // S.of(context).keyName
    [I18nPatternType.GENERATED_CLASS]: /\bS\.of\(\s*context\s*\)\.([a-zA-Z][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/g,
    
    // context.l10n.keyName
    [I18nPatternType.CONTEXT_L10N]: /\bcontext\.l10n\.([a-zA-Z][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/g,
    
    // AppLocalizations.of(context)!.keyName
    [I18nPatternType.APP_LOCALIZATIONS]: /\bAppLocalizations\.of\(\s*context\s*\)!?\.([a-zA-Z][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/g,
    
    // Intl.message('text', name: 'keyName')
    [I18nPatternType.INTL_MESSAGE]: /\bIntl\.message\s*\(\s*['"]([^'"]*)['"]\s*,\s*name\s*:\s*['"]([a-zA-Z][a-zA-Z0-9_]*)['"](?:\s*,\s*([^)]*))?\s*\)/g
  };
  
  // 当前使用的模式（可能是默认的或自定义的）
  private patterns: Partial<Record<I18nPatternType, RegExp>>;
  
  // 默认变量声明模式
  private readonly defaultVariableDeclarationPatterns = [
    // final l10n = AppLocalizations.of(context)!;
    /(?:final|var|const)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*AppLocalizations\.of\(\s*context\s*\)!?/g,
    // final l10n = context.l10n;
    /(?:final|var|const)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*context\.l10n/g,
    // final l10n = S.of(context);
    /(?:final|var|const)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*S\.of\(\s*context\s*\)/g
  ];
  
  // 当前使用的变量声明模式
  private variableDeclarationPatterns: RegExp[];
  
  // 变量引用模式（如 l10n.keyName, localizations.keyName 等）
  private readonly variablePattern = /\b([a-zA-Z][a-zA-Z0-9_]*)\.(([a-zA-Z][a-zA-Z0-9_]*))(?:\(([^)]*)\))?/g;
  
  // 参数解析正则
  private readonly parameterPattern = /([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*([^,)]+)/g;

  private constructor() {
    this.patterns = { ...this.defaultPatterns };
    this.variableDeclarationPatterns = [...this.defaultVariableDeclarationPatterns];
    this.loadCustomPatterns();
  }

  public static getInstance(): DartParser {
    if (!DartParser.instance) {
      DartParser.instance = new DartParser();
    }
    return DartParser.instance;
  }
  
  /**
   * 从 VSCode 配置加载自定义正则表达式
   */
  private loadCustomPatterns(): void {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const enableCustomPatterns = config.get<boolean>('enableCustomPatterns', false);
    
    if (!enableCustomPatterns) {
      console.log('🔧 [DartParser] Using default patterns');
      return;
    }
    
    const customPatterns = config.get<any>('customPatterns', {});
    console.log('🔧 [DartParser] Loading custom patterns:', customPatterns);
    
    try {
      // 加载自定义的 i18n 模式
      if (customPatterns.generatedClass) {
        this.patterns[I18nPatternType.GENERATED_CLASS] = new RegExp(customPatterns.generatedClass, 'g');
        console.log('✅ [DartParser] Loaded custom generatedClass pattern');
      }
      
      if (customPatterns.contextL10n) {
        this.patterns[I18nPatternType.CONTEXT_L10N] = new RegExp(customPatterns.contextL10n, 'g');
        console.log('✅ [DartParser] Loaded custom contextL10n pattern');
      }
      
      if (customPatterns.appLocalizations) {
        this.patterns[I18nPatternType.APP_LOCALIZATIONS] = new RegExp(customPatterns.appLocalizations, 'g');
        console.log('✅ [DartParser] Loaded custom appLocalizations pattern');
      }
      
      if (customPatterns.intlMessage) {
        this.patterns[I18nPatternType.INTL_MESSAGE] = new RegExp(customPatterns.intlMessage, 'g');
        console.log('✅ [DartParser] Loaded custom intlMessage pattern');
      }
      
      // 加载自定义的变量声明模式
      if (customPatterns.variableDeclarations && Array.isArray(customPatterns.variableDeclarations)) {
        this.variableDeclarationPatterns = customPatterns.variableDeclarations.map((pattern: string) => {
          return new RegExp(pattern, 'g');
        });
        console.log('✅ [DartParser] Loaded custom variable declaration patterns:', customPatterns.variableDeclarations.length);
      }
      
    } catch (error) {
      console.error('❌ [DartParser] Error loading custom patterns:', error);
      console.log('🔄 [DartParser] Falling back to default patterns');
      // 出错时回退到默认模式
      this.patterns = { ...this.defaultPatterns };
      this.variableDeclarationPatterns = [...this.defaultVariableDeclarationPatterns];
    }
  }
  
  /**
   * 重新加载配置（当配置更改时调用）
   */
  public reloadConfiguration(): void {
    this.patterns = { ...this.defaultPatterns };
    this.variableDeclarationPatterns = [...this.defaultVariableDeclarationPatterns];
    this.loadCustomPatterns();
    // 清除缓存以强制重新解析
    this.cache.clear();
    console.log('🔄 [DartParser] Configuration reloaded');
  }

  /**
   * 解析 Dart 文档中的 i18n 引用
   */
  public parseDocument(document: vscode.TextDocument): DartParseResult {
    const references: I18nReference[] = [];
    const errors: ParseError[] = [];
    
    try {
      const text = document.getText();
      
      // 首先查找 i18n 变量声明
      const i18nVariables = this.findI18nVariables(text);
      console.log('🔍 [DartParser] Found i18n variables:', i18nVariables);
      
      // 解析每种模式
      for (const [patternType, regex] of Object.entries(this.patterns)) {
        if (regex) { // 确保正则表达式存在
          const patternRefs = this.parsePattern(
            text, 
            regex, 
            patternType as I18nPatternType, 
            document
          );
          references.push(...patternRefs);
        }
      }
      
      // 解析变量引用模式
      if (i18nVariables.length > 0) {
        const variableRefs = this.parseVariableReferences(
          text,
          i18nVariables,
          document
        );
        references.push(...variableRefs);
        console.log('🔍 [DartParser] Found variable references:', variableRefs.length);
      }
      
      // 验证引用
      for (const ref of references) {
        const validationErrors = this.validateReference(ref, document);
        errors.push(...validationErrors);
      }
      
    } catch (error) {
      errors.push({
        message: `Parse error: ${error}`,
        severity: 'error'
      });
    }
    
    console.log('🔍 [DartParser] Total references found:', references.length);
    return {
      filePath: document.uri.fsPath,
      references,
      errors,
      timestamp: Date.now()
    };
  }

  /**
   * 解析特定模式的引用
   */
  private parsePattern(
    text: string, 
    regex: RegExp, 
    patternType: I18nPatternType, 
    document: vscode.TextDocument
  ): I18nReference[] {
    const references: I18nReference[] = [];
    let match;
    
    // 重置正则表达式的 lastIndex
    regex.lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      try {
        const ref = this.createReference(match, patternType, document, text);
        if (ref) {
          references.push(ref);
        }
      } catch (error) {
        console.warn(`Failed to create reference from match:`, error);
      }
    }
    
    return references;
  }

  /**
   * 创建 i18n 引用对象
   */
  private createReference(
    match: RegExpExecArray, 
    patternType: I18nPatternType, 
    document: vscode.TextDocument,
    text: string
  ): I18nReference | null {
    const fullMatch = match[0];
    const startIndex = match.index!;
    const endIndex = startIndex + fullMatch.length;
    
    // 计算位置
    const startPos = document.positionAt(startIndex);
    const endPos = document.positionAt(endIndex);
    const range = new vscode.Range(startPos, endPos);
    
    let key: string;
    let parameters: string[] | undefined;
    
    switch (patternType) {
      case I18nPatternType.GENERATED_CLASS:
      case I18nPatternType.CONTEXT_L10N:
      case I18nPatternType.APP_LOCALIZATIONS:
        key = match[1];
        parameters = match[2] ? this.parseParameters(match[2]) : undefined;
        break;
        
      case I18nPatternType.INTL_MESSAGE:
        key = match[2]; // name 参数的值
        parameters = match[3] ? this.parseParameters(match[3]) : undefined;
        break;
        
      default:
        return null;
    }
    
    // 验证键名
    if (!this.isValidKeyName(key)) {
      return null;
    }
    
    return {
      key,
      range,
      pattern: patternType,
      parameters,
      rawText: fullMatch,
      isValid: true
    };
  }

  /**
   * 解析参数列表
   */
  private parseParameters(paramString: string): string[] {
    const parameters: string[] = [];
    let match;
    
    // 重置正则表达式
    this.parameterPattern.lastIndex = 0;
    
    while ((match = this.parameterPattern.exec(paramString)) !== null) {
      parameters.push(match[1]); // 参数名
    }
    
    return parameters;
  }

  /**
   * 验证键名是否有效
   */
  private isValidKeyName(key: string): boolean {
    // 键名必须以字母开头，只能包含字母、数字和下划线
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
  }

  /**
   * 查找文档中的 i18n 变量声明
   */
  private findI18nVariables(text: string): string[] {
    const variables: string[] = [];
    
    // 使用当前配置的变量声明模式
    for (const pattern of this.variableDeclarationPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const varName = match[1];
        if (!variables.includes(varName)) {
          variables.push(varName);
        }
      }
    }
    
    return variables;
  }
  
  /**
   * 解析变量引用模式
   */
  private parseVariableReferences(
    text: string,
    i18nVariables: string[],
    document: vscode.TextDocument
  ): I18nReference[] {
    const references: I18nReference[] = [];
    
    for (const varName of i18nVariables) {
      // 为每个 i18n 变量创建特定的正则表达式
      const varPattern = new RegExp(
        `\\b${varName}\\.(([a-zA-Z][a-zA-Z0-9_]*))(?:\\(([^)]*)\\))?`,
        'g'
      );
      
      let match;
      varPattern.lastIndex = 0;
      
      while ((match = varPattern.exec(text)) !== null) {
        try {
          const fullMatch = match[0];
          const key = match[1];
          const parameters = match[2] ? this.parseParameters(match[2]) : undefined;
          
          const startIndex = match.index!;
          const endIndex = startIndex + fullMatch.length;
          const startPos = document.positionAt(startIndex);
          const endPos = document.positionAt(endIndex);
          const range = new vscode.Range(startPos, endPos);
          
          if (this.isValidKeyName(key)) {
            references.push({
              key,
              range,
              pattern: I18nPatternType.APP_LOCALIZATIONS, // 将变量引用归类为 APP_LOCALIZATIONS
              parameters,
              rawText: fullMatch,
              isValid: true
            });
          }
        } catch (error) {
          console.warn(`Failed to create variable reference:`, error);
        }
      }
    }
    
    return references;
  }
  
  /**
   * 验证引用的有效性
   */
  private validateReference(ref: I18nReference, document: vscode.TextDocument): ParseError[] {
    const errors: ParseError[] = [];
    
    // 检查键名长度
    if (ref.key.length > 64) {
      errors.push({
        message: `Key name too long: ${ref.key}`,
        range: ref.range,
        severity: 'warning'
      });
    }
    
    // 检查键名约定
    if (ref.key.includes('__')) {
      errors.push({
        message: `Avoid double underscores in key name: ${ref.key}`,
        range: ref.range,
        severity: 'info'
      });
    }
    
    // 检查是否在字符串或注释中
    if (this.isInStringOrComment(ref.range, document)) {
      errors.push({
        message: `i18n reference found in string or comment: ${ref.key}`,
        range: ref.range,
        severity: 'info'
      });
      ref.isValid = false;
    }
    
    return errors;
  }

  /**
   * 检查位置是否在字符串或注释中
   */
  private isInStringOrComment(range: vscode.Range, document: vscode.TextDocument): boolean {
    const line = document.lineAt(range.start.line);
    const lineText = line.text;
    const charIndex = range.start.character;
    
    // 简单的字符串和注释检测
    let inString = false;
    let inComment = false;
    let stringChar = '';
    
    for (let i = 0; i < charIndex; i++) {
      const char = lineText[i];
      const nextChar = lineText[i + 1];
      
      if (!inString && !inComment) {
        if (char === '/' && nextChar === '/') {
          inComment = true;
          i++; // 跳过下一个字符
        } else if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        }
      } else if (inString && char === stringChar && lineText[i - 1] !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
    
    return inString || inComment;
  }

  /**
   * 获取指定位置的 i18n 引用
   */
  public getReferenceAtPosition(document: vscode.TextDocument, position: vscode.Position): I18nReference | null {
    const parseResult = this.parseDocument(document);
    
    for (const ref of parseResult.references) {
      if (ref.range.contains(position)) {
        return ref;
      }
    }
    
    return null;
  }

  /**
   * 获取指定行的所有 i18n 引用
   */
  public getReferencesInLine(document: vscode.TextDocument, lineNumber: number): I18nReference[] {
    const parseResult = this.parseDocument(document);
    
    return parseResult.references.filter(ref => 
      ref.range.start.line === lineNumber || ref.range.end.line === lineNumber
    );
  }

  /**
   * 查找所有使用指定键的引用
   */
  public findKeyUsages(document: vscode.TextDocument, key: string): I18nReference[] {
    const parseResult = this.parseDocument(document);
    
    return parseResult.references.filter(ref => ref.key === key);
  }

  /**
   * 获取文档中所有唯一的键
   */
  public getUniqueKeys(document: vscode.TextDocument): Set<string> {
    const parseResult = this.parseDocument(document);
    const keys = new Set<string>();
    
    for (const ref of parseResult.references) {
      if (ref.isValid) {
        keys.add(ref.key);
      }
    }
    
    return keys;
  }

  /**
   * 检查文档是否包含 i18n 引用
   */
  public hasI18nReferences(document: vscode.TextDocument): boolean {
    const text = document.getText();
    
    // 快速检查是否包含任何 i18n 模式
    for (const regex of Object.values(this.patterns)) {
      regex.lastIndex = 0;
      if (regex.test(text)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 生成 i18n 引用的代码片段
   */
  public generateReference(key: string, patternType: I18nPatternType, parameters?: string[]): string {
    const paramString = parameters && parameters.length > 0 
      ? `(${parameters.map(p => `${p}: ${p}`).join(', ')})`
      : '';
    
    switch (patternType) {
      case I18nPatternType.GENERATED_CLASS:
        return `S.of(context).${key}${paramString}`;
        
      case I18nPatternType.CONTEXT_L10N:
        return `context.l10n.${key}${paramString}`;
        
      case I18nPatternType.APP_LOCALIZATIONS:
        return `AppLocalizations.of(context)!.${key}${paramString}`;
        
      case I18nPatternType.INTL_MESSAGE:
        const paramList = parameters && parameters.length > 0
          ? `, ${parameters.map(p => `${p}: ${p}`).join(', ')}`
          : '';
        return `Intl.message('', name: '${key}'${paramList})`;
        
      default:
        return `S.of(context).${key}${paramString}`;
    }
  }

  /**
   * 替换文档中的 i18n 引用
   */
  public async replaceReference(
    document: vscode.TextDocument, 
    oldRef: I18nReference, 
    newKey: string
  ): Promise<boolean> {
    try {
      const edit = new vscode.WorkspaceEdit();
      const newReference = this.generateReference(newKey, oldRef.pattern, oldRef.parameters);
      
      edit.replace(document.uri, oldRef.range, newReference);
      
      return await vscode.workspace.applyEdit(edit);
    } catch (error) {
      console.error('Failed to replace reference:', error);
      return false;
    }
  }

  /**
   * 添加自定义模式
   */
  public addCustomPattern(name: string, regex: RegExp): void {
    (this.patterns as any)[name] = regex;
  }

  /**
   * 移除自定义模式
   */
  public removeCustomPattern(name: string): void {
    delete (this.patterns as any)[name];
  }

  /**
   * 获取所有支持的模式
   */
  public getSupportedPatterns(): string[] {
    return Object.keys(this.patterns);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    // 清理缓存
    this.cache.clear();
  }
}

/**
 * 获取 Dart 解析器实例
 */
export function getDartParser(): DartParser {
  return DartParser.getInstance();
}