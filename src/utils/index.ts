/**
 * 工具函数集合
 * 提供常用的辅助函数和实用工具
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

// 异步文件操作
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const access = promisify(fs.access);
export const stat = promisify(fs.stat);
export const readdir = promisify(fs.readdir);
export const mkdir = promisify(fs.mkdir);

/**
 * 文件系统工具
 */
export class FileUtils {
  /**
   * 检查文件是否存在
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查是否为目录
   */
  static async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 检查是否为文件
   */
  static async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * 确保目录存在
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 读取JSON文件
   */
  static async readJson<T = any>(filePath: string): Promise<T> {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * 写入JSON文件
   */
  static async writeJson(filePath: string, data: any, indent: number = 2): Promise<void> {
    const content = JSON.stringify(data, null, indent);
    await FileUtils.ensureDir(path.dirname(filePath));
    await writeFile(filePath, content, 'utf8');
  }

  /**
   * 获取文件扩展名
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * 获取文件名（不含扩展名）
   */
  static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 规范化路径
   */
  static normalizePath(filePath: string): string {
    return path.normalize(filePath).replace(/\\/g, '/');
  }

  /**
   * 获取相对路径
   */
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to).replace(/\\/g, '/');
  }

  /**
   * 查找文件
   */
  static async findFiles(
    directory: string,
    pattern: RegExp,
    maxDepth: number = 10
  ): Promise<string[]> {
    const results: string[] = [];
    
    async function search(dir: string, depth: number): Promise<void> {
      if (depth > maxDepth) {
        return;
      }
      
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await search(fullPath, depth + 1);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            results.push(fullPath);
          }
        }
      } catch {
        // 忽略无法访问的目录
      }
    }
    
    await search(directory, 0);
    return results;
  }
}

/**
 * 字符串工具
 */
export class StringUtils {
  /**
   * 驼峰命名转换
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  /**
   * 帕斯卡命名转换
   */
  static toPascalCase(str: string): string {
    const camelCase = StringUtils.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * 蛇形命名转换
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toLowerCase();
  }

  /**
   * 短横线命名转换
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .replace(/^-/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase();
  }

  /**
   * 首字母大写
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 截断字符串
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 计算字符串相似度（Levenshtein距离）
   */
  static similarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // 初始化矩阵
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // 计算距离
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // 删除
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j - 1] + cost // 替换
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * 转义正则表达式特殊字符
   */
  static escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 生成随机字符串
   */
  static randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 检查是否为有效的键名
   */
  static isValidKey(key: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
  }

  /**
   * 从文本生成键名
   */
  static generateKeyFromText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map((word, index) => index === 0 ? word : StringUtils.capitalize(word))
      .join('');
  }
}

/**
 * 数组工具
 */
export class ArrayUtils {
  /**
   * 去重
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * 分组
   */
  static groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  /**
   * 分块
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 差集
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  }

  /**
   * 交集
   */
  static intersection<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  }

  /**
   * 并集
   */
  static union<T>(array1: T[], array2: T[]): T[] {
    return ArrayUtils.unique([...array1, ...array2]);
  }

  /**
   * 排序（支持多个键）
   */
  static sortBy<T>(
    array: T[],
    ...keyFns: Array<(item: T) => any>
  ): T[] {
    return [...array].sort((a, b) => {
      for (const keyFn of keyFns) {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  }
}

/**
 * 对象工具
 */
export class ObjectUtils {
  /**
   * 深拷贝
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => ObjectUtils.deepClone(item)) as any;
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = ObjectUtils.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * 深度合并
   */
  static deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (ObjectUtils.isObject(target) && ObjectUtils.isObject(source)) {
      for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (ObjectUtils.isObject(sourceValue) && ObjectUtils.isObject(targetValue)) {
          ObjectUtils.deepMerge(targetValue as object, sourceValue as object);
        } else {
          Object.assign(target, { [key]: sourceValue });
        }
      }
    }
    
    return ObjectUtils.deepMerge(target, ...sources);
  }

  /**
   * 检查是否为对象
   */
  static isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 获取嵌套属性
   */
  static get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  }

  /**
   * 设置嵌套属性
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || !ObjectUtils.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * 删除嵌套属性
   */
  static unset(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || !ObjectUtils.isObject(current[key])) {
        return false;
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }

  /**
   * 扁平化对象
   */
  static flatten(obj: any, prefix: string = '', separator: string = '.'): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (ObjectUtils.isObject(obj[key])) {
          Object.assign(result, ObjectUtils.flatten(obj[key], newKey, separator));
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    
    return result;
  }
}

/**
 * VS Code 工具
 */
export class VSCodeUtils {
  /**
   * 获取工作区根路径
   */
  static getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * 获取活动编辑器
   */
  static getActiveEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  /**
   * 获取活动文档
   */
  static getActiveDocument(): vscode.TextDocument | undefined {
    return vscode.window.activeTextEditor?.document;
  }

  /**
   * 检查文件是否为Dart文件
   */
  static isDartFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'dart';
  }

  /**
   * 检查文件是否为ARB文件
   */
  static isArbFile(uri: vscode.Uri): boolean {
    return path.extname(uri.fsPath).toLowerCase() === '.arb';
  }

  /**
   * 获取文档中指定位置的单词
   */
  static getWordAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): string | undefined {
    const range = document.getWordRangeAtPosition(position);
    return range ? document.getText(range) : undefined;
  }

  /**
   * 获取文档中指定行的文本
   */
  static getLineText(document: vscode.TextDocument, lineNumber: number): string {
    if (lineNumber < 0 || lineNumber >= document.lineCount) {
      return '';
    }
    return document.lineAt(lineNumber).text;
  }

  /**
   * 创建范围
   */
  static createRange(
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  ): vscode.Range {
    return new vscode.Range(
      new vscode.Position(startLine, startCharacter),
      new vscode.Position(endLine, endCharacter)
    );
  }

  /**
   * 显示信息消息
   */
  static showInfo(message: string, ...items: string[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message, ...items);
  }

  /**
   * 显示警告消息
   */
  static showWarning(message: string, ...items: string[]): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(message, ...items);
  }

  /**
   * 显示错误消息
   */
  static showError(message: string, ...items: string[]): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message, ...items);
  }

  /**
   * 打开文件
   */
  static async openFile(filePath: string): Promise<vscode.TextEditor | undefined> {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      return await vscode.window.showTextDocument(document);
    } catch (error) {
      console.error('Error opening file:', error);
      return undefined;
    }
  }

  /**
   * 跳转到文件中的指定位置
   */
  static async goToPosition(
    filePath: string,
    line: number,
    character: number = 0
  ): Promise<void> {
    const editor = await VSCodeUtils.openFile(filePath);
    if (editor) {
      const position = new vscode.Position(line, character);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    }
  }
}

/**
 * 性能工具
 */
export class PerformanceUtils {
  private static timers: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  static startTimer(name: string): void {
    PerformanceUtils.timers.set(name, Date.now());
  }

  /**
   * 结束计时并返回耗时
   */
  static endTimer(name: string): number {
    const startTime = PerformanceUtils.timers.get(name);
    if (startTime === undefined) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const duration = Date.now() - startTime;
    PerformanceUtils.timers.delete(name);
    return duration;
  }

  /**
   * 测量函数执行时间
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    PerformanceUtils.startTimer(name);
    try {
      const result = await fn();
      const duration = PerformanceUtils.endTimer(name);
      return { result, duration };
    } catch (error) {
      PerformanceUtils.endTimer(name);
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  static measure<T>(
    name: string,
    fn: () => T
  ): { result: T; duration: number } {
    PerformanceUtils.startTimer(name);
    try {
      const result = fn();
      const duration = PerformanceUtils.endTimer(name);
      return { result, duration };
    } catch (error) {
      PerformanceUtils.endTimer(name);
      throw error;
    }
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  }
}

/**
 * 验证工具
 */
export class ValidationUtils {
  /**
   * 验证ARB文件格式
   */
  static validateArbFormat(content: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (typeof content !== 'object' || content === null) {
      errors.push('ARB content must be an object');
      return { valid: false, errors };
    }
    
    // 检查必需的元数据
    if (!content['@@locale']) {
      errors.push('Missing required @@locale metadata');
    }
    
    // 验证键名格式
    for (const key in content) {
      if (key.startsWith('@')) {
        continue; // 跳过元数据
      }
      
      if (!StringUtils.isValidKey(key)) {
        errors.push(`Invalid key format: ${key}`);
      }
      
      if (typeof content[key] !== 'string') {
        errors.push(`Value for key '${key}' must be a string`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证语言代码
   */
  static validateLocaleCode(locale: string): boolean {
    // 基本的语言代码验证（ISO 639-1 和 ISO 3166-1）
    return /^[a-z]{2}(_[A-Z]{2})?$/.test(locale);
  }

  /**
   * 验证翻译参数
   */
  static validateTranslationParameters(
    text: string,
    expectedParams: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 提取文本中的参数
    const paramMatches = text.match(/\{([^}]+)\}/g) || [];
    const actualParams = paramMatches.map(match => match.slice(1, -1));
    
    // 检查缺失的参数
    for (const param of expectedParams) {
      if (!actualParams.includes(param)) {
        errors.push(`Missing parameter: {${param}}`);
      }
    }
    
    // 检查多余的参数
    for (const param of actualParams) {
      if (!expectedParams.includes(param)) {
        errors.push(`Unexpected parameter: {${param}}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}

/**
 * 日志工具
 */
export class LogUtils {
  private static outputChannel: vscode.OutputChannel | undefined;

  /**
   * 获取输出通道
   */
  private static getOutputChannel(): vscode.OutputChannel {
    if (!LogUtils.outputChannel) {
      LogUtils.outputChannel = vscode.window.createOutputChannel('Flutter i18n');
    }
    return LogUtils.outputChannel;
  }

  /**
   * 记录信息
   */
  static info(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] INFO: ${message}`;
    
    console.log(formattedMessage, ...args);
    LogUtils.getOutputChannel().appendLine(formattedMessage);
  }

  /**
   * 记录警告
   */
  static warn(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] WARN: ${message}`;
    
    console.warn(formattedMessage, ...args);
    LogUtils.getOutputChannel().appendLine(formattedMessage);
  }

  /**
   * 记录错误
   */
  static error(message: string, error?: Error, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ERROR: ${message}`;
    
    console.error(formattedMessage, error, ...args);
    LogUtils.getOutputChannel().appendLine(formattedMessage);
    
    if (error) {
      LogUtils.getOutputChannel().appendLine(`Stack trace: ${error.stack}`);
    }
  }

  /**
   * 记录调试信息
   */
  static debug(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] DEBUG: ${message}`;
    
    console.debug(formattedMessage, ...args);
    LogUtils.getOutputChannel().appendLine(formattedMessage);
  }

  /**
   * 显示输出通道
   */
  static show(): void {
    LogUtils.getOutputChannel().show();
  }

  /**
   * 清空日志
   */
  static clear(): void {
    LogUtils.getOutputChannel().clear();
  }

  /**
   * 释放资源
   */
  static dispose(): void {
    if (LogUtils.outputChannel) {
      LogUtils.outputChannel.dispose();
      LogUtils.outputChannel = undefined;
    }
  }
}

// 导出常用的工具函数
export {
  FileUtils as File,
  StringUtils as String,
  ArrayUtils as Array,
  ObjectUtils as Object,
  VSCodeUtils as VSCode,
  PerformanceUtils as Performance,
  ValidationUtils as Validation,
  LogUtils as Log
};

// 导出类型守卫
export const isString = (value: any): value is string => typeof value === 'string';
export const isNumber = (value: any): value is number => typeof value === 'number';
export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';
export const isArray = (value: any): value is any[] => Array.isArray(value);
export const isObject = (value: any): value is object => ObjectUtils.isObject(value);
export const isFunction = (value: any): value is Function => typeof value === 'function';
export const isUndefined = (value: any): value is undefined => value === undefined;
export const isNull = (value: any): value is null => value === null;
export const isNullOrUndefined = (value: any): value is null | undefined => value == null;

// 导出常用常量
export const CONSTANTS = {
  ARB_FILE_EXTENSION: '.arb',
  DART_FILE_EXTENSION: '.dart',
  L10N_CONFIG_FILE: 'l10n.yaml',
  PUBSPEC_CONFIG_FILE: 'pubspec.yaml',
  DEFAULT_LOCALE: 'en',
  SUPPORTED_LOCALES: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'ar'],
  I18N_PATTERNS: {
    S_OF_CONTEXT: /S\.of\(context\)\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    CONTEXT_L10N: /context\.l10n\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    APP_LOCALIZATIONS: /AppLocalizations\.of\(context\)!?\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    INTL_MESSAGE: /Intl\.message\s*\([^)]*name\s*:\s*['"]([^'"]+)['"]/g
  }
};