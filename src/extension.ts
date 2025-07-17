// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/**
 * Flutter i18n VS Code Inline Extension
 * 主入口文件
 */

import * as vscode from 'vscode';
import { ProjectDetector } from './core/projectDetector';
import { ArbManager } from './core/arbManager';
import { DartParser } from './core/dartParser';
import { CacheManager } from './core/cacheManager';
import { ConfigManager } from './core/configManager';
import { EventManager } from './core/eventManager';
import { CommandHandler } from './commands/commandHandler';
import { I18nCodeLensProvider } from './providers/codeLensProvider';
import { I18nHoverProvider } from './providers/hoverProvider';
import { I18nDiagnosticProvider, I18nCodeActionProvider } from './providers/diagnosticProvider';
import { TranslationEditorProvider } from './editors/translationEditor';
import { PluginEventType } from './types';

// 全局实例
let projectDetector: ProjectDetector;
let arbManager: ArbManager;
let dartParser: DartParser;
let cacheManager: CacheManager;
let configManager: ConfigManager;
let eventManager: EventManager;
let diagnosticProvider: I18nDiagnosticProvider;
let codeLensProvider: I18nCodeLensProvider;
let hoverProvider: I18nHoverProvider;
let codeActionProvider: I18nCodeActionProvider;
let translationEditorProvider: TranslationEditorProvider;

/**
 * 插件激活函数
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('🚀 [Flutter i18n] Starting extension activation...');
  console.log('🚀 [Flutter i18n] Extension context:', {
    extensionPath: context.extensionPath,
    globalState: Object.keys(context.globalState.keys()),
    workspaceState: Object.keys(context.workspaceState.keys())
  });
  
  // 检查工作区
  const workspaceFolders = vscode.workspace.workspaceFolders;
  console.log('🚀 [Flutter i18n] Workspace folders:', workspaceFolders?.map(f => f.uri.fsPath) || 'None');
  
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log('❌ [Flutter i18n] No workspace folders found, extension will remain inactive');
    return;
  }
  
  try {
    console.log('🔧 [Flutter i18n] Step 1: Initializing core managers...');
    // 初始化核心管理器
    await initializeManagers(context);
    console.log('✅ [Flutter i18n] Core managers initialized successfully');
    
    console.log('🔍 [Flutter i18n] Step 2: Detecting Flutter project...');
    // 检测Flutter项目
    const isFlutterProject = await detectFlutterProject();
    if (!isFlutterProject) {
      console.log('❌ [Flutter i18n] No Flutter project detected, extension will remain inactive');
      vscode.window.showWarningMessage('Flutter i18n: No Flutter project detected in workspace');
      return;
    }
    console.log('✅ [Flutter i18n] Flutter project detected successfully');
    
    console.log('🔌 [Flutter i18n] Step 3: Initializing providers...');
    // 初始化提供者
    await initializeProviders(context);
    console.log('✅ [Flutter i18n] Providers initialized successfully');
    
    console.log('⚡ [Flutter i18n] Step 4: Registering commands...');
    // 注册命令
    CommandHandler.registerCommands(context);
    console.log('✅ [Flutter i18n] Commands registered successfully');
    
    console.log('📝 [Flutter i18n] Step 5: Registering editors...');
    // 注册编辑器
    registerEditors(context);
    console.log('✅ [Flutter i18n] Editors registered successfully');
    
    console.log('👂 [Flutter i18n] Step 6: Setting up event listeners...');
    // 设置事件监听
    setupEventListeners();
    console.log('✅ [Flutter i18n] Event listeners set up successfully');
    
    console.log('👀 [Flutter i18n] Step 7: Starting file watching...');
    // 启动文件监听
    await startFileWatching(context);
    console.log('✅ [Flutter i18n] File watching started successfully');
    
    console.log('🎉 [Flutter i18n] Extension activated successfully!');
    
    // 显示激活消息（仅在调试模式下）
    const config = configManager.getConfiguration();
    console.log('🔧 [Flutter i18n] Current configuration:', config);
    
    if (config.debug.enabled) {
      vscode.window.showInformationMessage('Flutter i18n VS Code Inline is now active!');
    }
    
    // 强制显示激活状态（用于调试）
    vscode.window.showInformationMessage('🎉 Flutter i18n extension activated! Check console for details.');
    
  } catch (error) {
    console.error('❌ [Flutter i18n] Failed to activate extension:', error);
    console.error('❌ [Flutter i18n] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    vscode.window.showErrorMessage(
      `Failed to activate Flutter i18n extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 初始化核心管理器
 */
async function initializeManagers(context: vscode.ExtensionContext): Promise<void> {
  // 初始化缓存管理器
  cacheManager = CacheManager.getInstance();
  
  // 初始化配置管理器
  configManager = ConfigManager.getInstance();
  
  // 初始化事件管理器
  eventManager = EventManager.getInstance();
  
  // 初始化项目检测器
  projectDetector = ProjectDetector.getInstance();
  
  // 初始化ARB管理器
  arbManager = ArbManager.getInstance();
  
  // 初始化Dart解析器
  dartParser = DartParser.getInstance();
  
  // 添加到订阅列表
  context.subscriptions.push(
    { dispose: () => cacheManager.dispose() },
    { dispose: () => configManager.dispose() },
    { dispose: () => eventManager.dispose() },
    { dispose: () => projectDetector.dispose() },
    { dispose: () => arbManager.dispose() },
    { dispose: () => dartParser.dispose() }
  );
}

/**
 * 检测Flutter项目
 */
async function detectFlutterProject(): Promise<boolean> {
  try {
    console.log('🔍 [Flutter i18n] Starting project detection...');
    
    const projectConfig = await projectDetector.detectProject();
    console.log('🔍 [Flutter i18n] Project detection result:', projectConfig);
    
    if (!projectConfig) {
      console.log('❌ [Flutter i18n] No valid Flutter project configuration found');
      return false;
    }
    
    console.log('🔍 [Flutter i18n] Found Flutter project with config:', {
      arbDirectory: projectConfig.arbDirectory,
      templateArbFile: projectConfig.templateArbFile,
      supportedLocales: projectConfig.supportedLocales,
      defaultLocale: projectConfig.defaultLocale,
      generatedDir: projectConfig.generatedDir,
      classPrefix: projectConfig.classPrefix,
      syntheticPackage: projectConfig.syntheticPackage
    });
    
    console.log('🔧 [Flutter i18n] Initializing ARB manager with project config...');
    // 初始化ARB管理器
    await arbManager.initialize(projectConfig);
    console.log('✅ [Flutter i18n] ARB manager initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ [Flutter i18n] Error detecting Flutter project:', error);
    console.error('❌ [Flutter i18n] Detection error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return false;
  }
}

/**
 * 初始化提供者
 */
async function initializeProviders(context: vscode.ExtensionContext): Promise<void> {
  console.log('🔌 [Flutter i18n] Creating provider instances...');
  
  // 初始化诊断提供者
  console.log('🔌 [Flutter i18n] Creating diagnostic provider...');
  diagnosticProvider = new I18nDiagnosticProvider();
  console.log('✅ [Flutter i18n] Diagnostic provider created');
  
  // 初始化CodeLens提供者
  console.log('🔌 [Flutter i18n] Creating CodeLens provider...');
  codeLensProvider = new I18nCodeLensProvider();
  console.log('✅ [Flutter i18n] CodeLens provider created');
  
  // 初始化悬停提供者
  console.log('🔌 [Flutter i18n] Creating hover provider...');
  hoverProvider = new I18nHoverProvider();
  console.log('✅ [Flutter i18n] Hover provider created');
  
  // 初始化代码操作提供者
  console.log('🔌 [Flutter i18n] Creating code action provider...');
  codeActionProvider = new I18nCodeActionProvider();
  console.log('✅ [Flutter i18n] Code action provider created');
  
  console.log('📝 [Flutter i18n] Registering providers with VSCode...');
  
  // 注册提供者
  context.subscriptions.push(
    // CodeLens提供者
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'dart' },
      codeLensProvider
    ),
    
    // 悬停提供者
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'dart' },
      hoverProvider
    ),
    
    // 代码操作提供者
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'dart' },
      codeActionProvider,
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.Refactor
        ]
      }
    ),
    
    // 诊断提供者（通过事件系统工作）
    { dispose: () => diagnosticProvider.dispose() }
  );
  
  console.log('✅ [Flutter i18n] All providers registered successfully');
  console.log('📊 [Flutter i18n] Total subscriptions:', context.subscriptions.length);
}

/**
 * 注册编辑器
 */
function registerEditors(context: vscode.ExtensionContext): void {
  // 翻译编辑器
  translationEditorProvider = new TranslationEditorProvider(context);
  
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'flutter-i18n-vscode-inline.translationEditor',
      translationEditorProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    
    { dispose: () => translationEditorProvider.dispose() }
  );
}

/**
 * 设置事件监听
 */
function setupEventListeners(): void {
  // 监听配置变更
  configManager.onConfigurationChanged((config) => {
    console.log('Configuration changed, refreshing providers...');
    
    // 重新加载 DartParser 配置
    if (dartParser) {
      dartParser.reloadConfiguration();
      console.log('DartParser configuration reloaded');
    }
    
    // 刷新提供者
    if (codeLensProvider) {
      codeLensProvider.refresh();
    }
    
    if (diagnosticProvider) {
      diagnosticProvider.refreshAll();
    }
  });
  
  // 监听ARB文件变更
  eventManager.on(PluginEventType.ARB_FILE_CHANGED, async (event) => {
    console.log(`ARB file changed: ${event.data.locale}`);
    
    // 刷新相关提供者
    if (codeLensProvider) {
      codeLensProvider.refresh();
    }
    
    if (diagnosticProvider) {
      diagnosticProvider.refreshAll();
    }
  });
  
  // 监听项目配置变更
  eventManager.on(PluginEventType.PROJECT_CONFIG_CHANGED, async (event) => {
    console.log('Project configuration changed, reinitializing...');
    
    try {
      // 重新初始化ARB管理器
      const projectConfig = await projectDetector.getProjectConfig();
      if (projectConfig) {
        await arbManager.initialize(projectConfig);
      }
      
      // 刷新所有提供者
      if (codeLensProvider) {
        codeLensProvider.refresh();
      }
      
      if (diagnosticProvider) {
        diagnosticProvider.refreshAll();
      }
    } catch (error) {
      console.error('Error reinitializing after config change:', error);
    }
  });
  
  // 监听错误事件
  eventManager.on(PluginEventType.ERROR, (event) => {
    const { error, context } = event.data;
    console.error(`Error in ${context}:`, error);
    
    const config = configManager.getConfiguration();
    if (config.debug.enabled) {
      vscode.window.showErrorMessage(
        `Flutter i18n Error in ${context}: ${error.message}`
      );
    }
  });
}

/**
 * 启动文件监听
 */
async function startFileWatching(context: vscode.ExtensionContext): Promise<void> {
  const config = configManager.getConfiguration();
  
  if (!config.fileWatcher.enabled) {
    return;
  }
  
  // 监听ARB文件变更
  if (config.fileWatcher.watchArbFiles) {
    const arbWatcher = vscode.workspace.createFileSystemWatcher('**/*.arb');
    
    arbWatcher.onDidChange(async (uri) => {
      console.log(`ARB file changed: ${uri.fsPath}`);
      await handleArbFileChange(uri);
    });
    
    arbWatcher.onDidCreate(async (uri) => {
      console.log(`ARB file created: ${uri.fsPath}`);
      await handleArbFileChange(uri);
    });
    
    arbWatcher.onDidDelete(async (uri) => {
      console.log(`ARB file deleted: ${uri.fsPath}`);
      await handleArbFileChange(uri);
    });
    
    context.subscriptions.push(arbWatcher);
  }
  
  // 监听配置文件变更
  if (config.fileWatcher.watchConfigFiles) {
    const configWatcher = vscode.workspace.createFileSystemWatcher(
      '{**/l10n.yaml,**/pubspec.yaml}'
    );
    
    configWatcher.onDidChange(async (uri) => {
      console.log(`Config file changed: ${uri.fsPath}`);
      await handleConfigFileChange(uri);
    });
    
    context.subscriptions.push(configWatcher);
  }
  
  // 监听Dart文件变更
  const dartWatcher = vscode.workspace.createFileSystemWatcher('**/*.dart');
  
  dartWatcher.onDidChange(async (uri) => {
    await handleDartFileChange(uri);
  });
  
  dartWatcher.onDidCreate(async (uri) => {
    await handleDartFileChange(uri);
  });
  
  dartWatcher.onDidDelete(async (uri) => {
    await handleDartFileChange(uri);
  });
  
  context.subscriptions.push(dartWatcher);
}

/**
 * 处理ARB文件变更
 */
async function handleArbFileChange(uri: vscode.Uri): Promise<void> {
  try {
    const config = configManager.getConfiguration();
    
    // 防抖处理
    setTimeout(async () => {
      // 重新加载ARB文件
      const projectConfig = await projectDetector.detectProject();
      if (projectConfig) {
        await arbManager.loadArbFiles(projectConfig);
      }
      
      // 清除相关缓存
      cacheManager.clearByPrefix('arb:');
      
      // 刷新提供者
      if (codeLensProvider) {
        codeLensProvider.refresh();
      }
      
      if (diagnosticProvider) {
        diagnosticProvider.refreshAll();
      }
    }, config.fileWatcher.debounceDelay);
  } catch (error) {
    console.error('Error handling ARB file change:', error);
  }
}

/**
 * 处理配置文件变更
 */
async function handleConfigFileChange(uri: vscode.Uri): Promise<void> {
  try {
    const config = configManager.getConfiguration();
    
    // 防抖处理
    setTimeout(async () => {
      // 刷新项目配置
      const projectConfig = await projectDetector.refreshConfig();
      
      // 重新初始化ARB管理器
      if (projectConfig) {
        await arbManager.initialize(projectConfig);
      }
      
      // 清除相关缓存
      cacheManager.clearByPrefix('project:');
      cacheManager.clearByPrefix('arb:');
      
      // 刷新提供者
      if (codeLensProvider) {
        codeLensProvider.refresh();
      }
      
      if (diagnosticProvider) {
        diagnosticProvider.refreshAll();
      }
    }, config.fileWatcher.debounceDelay);
  } catch (error) {
    console.error('Error handling config file change:', error);
  }
}

/**
 * 处理Dart文件变更
 */
async function handleDartFileChange(uri: vscode.Uri): Promise<void> {
  try {
    // 清除该文件的缓存
    cacheManager.clearByPrefix(`dart:${uri.toString()}`);
    
    // 刷新该文件的诊断
    if (diagnosticProvider) {
      diagnosticProvider.refreshDocument(uri);
    }
  } catch (error) {
    console.error('Error handling Dart file change:', error);
  }
}

/**
 * 插件停用函数
 */
export function deactivate(): void {
  console.log('Deactivating Flutter i18n VS Code Inline extension...');
  
  // 释放所有资源
  try {
    if (cacheManager) {
      cacheManager.dispose();
    }
    
    if (configManager) {
      configManager.dispose();
    }
    
    if (eventManager) {
      eventManager.dispose();
    }
    
    if (projectDetector) {
      projectDetector.dispose();
    }
    
    if (arbManager) {
      arbManager.dispose();
    }
    
    if (dartParser) {
      dartParser.dispose();
    }
    
    if (diagnosticProvider) {
      diagnosticProvider.dispose();
    }
    
    if (translationEditorProvider) {
      translationEditorProvider.dispose();
    }
    
    console.log('Flutter i18n VS Code Inline extension deactivated successfully');
  } catch (error) {
    console.error('Error during extension deactivation:', error);
  }
}

// 导出全局实例访问器（用于其他模块）
export const getProjectDetector = (): ProjectDetector => projectDetector;
export const getArbManager = (): ArbManager => arbManager;
export const getDartParser = (): DartParser => dartParser;
export const getCacheManager = (): CacheManager => cacheManager;
export const getConfigManager = (): ConfigManager => configManager;
export const getEventManager = (): EventManager => eventManager;
