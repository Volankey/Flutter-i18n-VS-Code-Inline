/**
 * Flutter i18n VsCode Inline 插件类型定义
 */

import * as vscode from 'vscode';

// ============================================================================
// 项目配置相关类型
// ============================================================================

/**
 * Flutter 项目配置
 */
export interface ProjectConfig {
  /** 是否为 Flutter 项目 */
  isFlutterProject: boolean;
  /** ARB 文件目录 */
  arbDirectory: string;
  /** 支持的语言列表 */
  supportedLocales: string[];
  /** 模板 ARB 文件路径 */
  templateArbFile: string;
  /** 默认语言 */
  defaultLocale: string;
  /** 生成文件目录 */
  generatedDir: string;
  /** 类名前缀 */
  classPrefix?: string;
  /** 是否启用合成访问器 */
  syntheticPackage?: boolean;
}

/**
 * L10n 配置文件内容
 */
export interface L10nConfig {
  'arb-dir'?: string;
  'template-arb-file'?: string;
  'output-localization-file'?: string;
  'untranslated-messages-file'?: string;
  'output-class'?: string;
  'preferred-supported-locales'?: string[];
  'header'?: string;
  'header-file'?: string;
  'use-deferred-loading'?: boolean;
  'gen-inputs-and-outputs-list'?: string;
  'synthetic-package'?: boolean;
  'project-dir'?: string;
  'required-resource-attributes'?: boolean;
  'nullable-getter'?: boolean;
  'format'?: boolean;
  'use-escaping'?: boolean;
}

// ============================================================================
// ARB 文件相关类型
// ============================================================================

/**
 * ARB 文件条目
 */
export interface ArbEntry {
  /** 翻译键 */
  key: string;
  /** 翻译值 */
  value: string;
  /** 描述信息 */
  description?: string;
  /** 占位符定义 */
  placeholders?: Record<string, ArbPlaceholder>;
  /** 其他元数据 */
  metadata?: Record<string, any>;
}

/**
 * ARB 占位符定义
 */
export interface ArbPlaceholder {
  /** 占位符类型 */
  type?: string;
  /** 示例值 */
  example?: string;
  /** 描述 */
  description?: string;
  /** 格式化选项 */
  format?: string;
  /** 可选值 */
  optionalParameters?: Record<string, any>;
}

/**
 * ARB 文件表示
 */
export interface ArbFile {
  /** 语言代码 */
  locale: string;
  /** 文件路径 */
  filePath: string;
  /** 翻译条目映射 */
  entries: Map<string, ArbEntry>;
  /** 最后修改时间 */
  lastModified: number;
  /** 是否为模板文件 */
  isTemplate: boolean;
  /** 文件编码 */
  encoding?: string;
}

/**
 * ARB 文件变更事件
 */
export interface ArbFileChangeEvent {
  /** 文件路径 */
  filePath: string;
  /** 变更类型 */
  changeType: 'created' | 'modified' | 'deleted';
  /** 变更时间 */
  timestamp: number;
  /** 受影响的键 */
  affectedKeys?: string[];
}

// ============================================================================
// Dart 代码解析相关类型
// ============================================================================

/**
 * i18n 引用信息
 */
export interface I18nReference {
  /** 翻译键 */
  key: string;
  /** 在文档中的范围 */
  range: vscode.Range;
  /** 匹配的模式类型 */
  pattern: I18nPatternType;
  /** 参数列表 */
  parameters?: string[];
  /** 原始匹配文本 */
  rawText: string;
  /** 是否为有效引用 */
  isValid: boolean;
}

/**
 * i18n 模式类型
 */
export enum I18nPatternType {
  /** S.of(context).keyName */
  GENERATED_CLASS = 'generated_class',
  /** context.l10n.keyName */
  CONTEXT_L10N = 'context_l10n',
  /** AppLocalizations.of(context)!.keyName */
  APP_LOCALIZATIONS = 'app_localizations',
  /** Intl.message() */
  INTL_MESSAGE = 'intl_message',
  /** 自定义模式 */
  CUSTOM = 'custom'
}

/**
 * Dart 文件解析结果
 */
export interface DartParseResult {
  /** 文件路径 */
  filePath: string;
  /** 找到的 i18n 引用 */
  references: I18nReference[];
  /** 解析错误 */
  errors: ParseError[];
  /** 解析时间戳 */
  timestamp: number;
}

/**
 * 解析错误
 */
export interface ParseError {
  /** 错误消息 */
  message: string;
  /** 错误位置 */
  range?: vscode.Range;
  /** 错误严重程度 */
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// 翻译相关类型
// ============================================================================

/**
 * 翻译条目
 */
export interface TranslationEntry {
  /** 翻译键 */
  key: string;
  /** 各语言的翻译值 */
  translations: Map<string, string>;
  /** 描述信息 */
  description?: string;
  /** 占位符信息 */
  placeholders?: Record<string, ArbPlaceholder>;
  /** 是否完整（所有语言都有翻译） */
  isComplete: boolean;
  /** 缺失的语言 */
  missingLocales: string[];
}

/**
 * 翻译状态
 */
export enum TranslationStatus {
  /** 完整 - 所有语言都有翻译 */
  COMPLETE = 'complete',
  /** 部分 - 部分语言有翻译 */
  PARTIAL = 'partial',
  /** 缺失 - 没有翻译 */
  MISSING = 'missing',
  /** 未使用 - 有翻译但代码中未使用 */
  UNUSED = 'unused'
}

/**
 * 翻译统计信息
 */
export interface TranslationStats {
  /** 总翻译键数量 */
  totalKeys: number;
  /** 完整翻译数量 */
  completeKeys: number;
  /** 部分翻译数量 */
  partialKeys: number;
  /** 缺失翻译数量 */
  missingKeys: number;
  /** 未使用翻译数量 */
  unusedKeys: number;
  /** 各语言统计 */
  localeStats: Map<string, LocaleStats>;
}

/**
 * 语言统计信息
 */
export interface LocaleStats {
  /** 语言代码 */
  locale: string;
  /** 翻译数量 */
  translationCount: number;
  /** 缺失数量 */
  missingCount: number;
  /** 完成度百分比 */
  completionPercentage: number;
}

// ============================================================================
// 诊断相关类型
// ============================================================================

/**
 * i18n 诊断类型
 */
export enum I18nDiagnosticType {
  /** 缺失翻译 */
  MISSING_TRANSLATION = 'missing_translation',
  /** 未使用的翻译 */
  UNUSED_TRANSLATION = 'unused_translation',
  /** 参数不匹配 */
  PARAMETER_MISMATCH = 'parameter_mismatch',
  /** 重复的键 */
  DUPLICATE_KEY = 'duplicate_key',
  /** 无效的键名 */
  INVALID_KEY = 'invalid_key',
  /** ARB 文件格式错误 */
  ARB_FORMAT_ERROR = 'arb_format_error'
}

/**
 * i18n 诊断信息
 */
export interface I18nDiagnostic {
  /** 诊断类型 */
  type: I18nDiagnosticType;
  /** 诊断消息 */
  message: string;
  /** 文件路径 */
  filePath: string;
  /** 位置范围 */
  range: vscode.Range;
  /** 严重程度 */
  severity: vscode.DiagnosticSeverity;
  /** 相关信息 */
  relatedInformation?: vscode.DiagnosticRelatedInformation[];
  /** 修复建议 */
  fixes?: QuickFix[];
}

/**
 * 快速修复
 */
export interface QuickFix {
  /** 修复标题 */
  title: string;
  /** 修复类型 */
  kind: vscode.CodeActionKind;
  /** 修复操作 */
  action: () => Promise<void>;
}

// ============================================================================
// 编辑器相关类型
// ============================================================================

/**
 * 翻译编辑请求
 */
export interface TranslationEditRequest {
  /** 翻译键 */
  key: string;
  /** 目标语言（可选，为空则编辑所有语言） */
  locale?: string;
  /** 初始值 */
  initialValue?: string;
  /** 编辑模式 */
  mode: 'inline' | 'dialog' | 'panel';
  /** 触发位置 */
  triggerRange?: vscode.Range;
}

/**
 * 翻译编辑结果
 */
export interface TranslationEditResult {
  /** 翻译键 */
  key: string;
  /** 是否成功 */
  success: boolean;
  /** 修改的翻译 */
  changes: Map<string, string>;
  /** 错误信息 */
  error?: string;
  /** 更新的语言列表 */
  updatedLocales?: string[];
}

// ============================================================================
// 配置相关类型
// ============================================================================

/**
 * 插件配置
 */
export interface PluginConfiguration {
  inlinePreview: {
    enabled: boolean;
    maxLength: number;
    showIcon: boolean;
    showStatus: boolean;
    languages: string[];
    position: string;
  };
  hoverPreview: {
    enabled: boolean;
    maxLength: number;
    showAllLanguages: boolean;
    showMetadata: boolean;
    showActions: boolean;
    languages: string[];
  };
  diagnostics: {
    enabled: boolean;
    missingTranslations: string;
    partialTranslations: string;
    invalidReferences: string;
    parameterMismatch: string;
    showQuickFixes: boolean;
  };
  autoCompletion: {
    enabled: boolean;
    showExistingKeys: boolean;
    showSuggestions: boolean;
    triggerCharacters: string[];
  };
  editor: {
    enableQuickEdit: boolean;
    enableBulkEdit: boolean;
    autoSave: boolean;
    validateOnSave: boolean;
  };
  fileWatcher: {
    enabled: boolean;
    watchArbFiles: boolean;
    watchConfigFiles: boolean;
    debounceDelay: number;
  };
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    maxCacheSize: number;
    enableLazyLoading: boolean;
  };
  debug: {
    enabled: boolean;
    logLevel: string;
    showPerformanceMetrics: boolean;
  };
  advanced: {
    customPatterns: any[];
    excludePatterns: any[];
    maxFileSize: number;
    enableExperimentalFeatures: boolean;
  };
}

// ============================================================================
// 缓存相关类型
// ============================================================================

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  /** 缓存值 */
  value: T;
  /** 创建时间 */
  timestamp: number;
  /** 过期时间 */
  expiresAt: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: number;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  /** 缓存大小 */
  size: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 内存使用量（字节） */
  memoryUsage: number;
}

// ============================================================================
// 事件相关类型
// ============================================================================

/**
 * 插件事件类型
 */
export enum PluginEventType {
  /** 项目配置变更 */
  PROJECT_CONFIG_CHANGED = 'project_config_changed',
  /** 插件配置变更 */
  PLUGIN_CONFIG_CHANGED = 'plugin_config_changed',
  /** ARB 文件变更 */
  ARB_FILE_CHANGED = 'arb_file_changed',
  /** 翻译更新 */
  TRANSLATION_UPDATED = 'translation_updated',
  /** 翻译删除 */
  TRANSLATION_DELETED = 'translation_deleted',
  /** 翻译键创建 */
  TRANSLATION_KEY_CREATED = 'translation_key_created',
  /** Dart 文件解析 */
  DART_FILE_PARSED = 'dart_file_parsed',
  /** 性能指标 */
  PERFORMANCE_METRIC = 'performance_metric',
  /** 缓存清理 */
  CACHE_CLEARED = 'cache_cleared',
  /** 诊断更新 */
  DIAGNOSTICS_UPDATED = 'diagnostics_updated',
  /** 错误事件 */
  ERROR = 'error'
}

/**
 * 插件事件
 */
export interface PluginEvent<T = any> {
  /** 事件类型 */
  type: PluginEventType;
  /** 事件数据 */
  data: T;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件源 */
  source: string;
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 可选的深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 异步结果类型
 */
export type AsyncResult<T, E = Error> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>;

/**
 * 事件监听器类型
 */
export type EventListener<T = any> = (event: PluginEvent<T>) => void | Promise<void>;

/**
 * 一次性事件监听器类型
 */
export type DisposableListener = {
  dispose(): void;
};