/**
 * 事件管理器
 * 处理插件内部的事件通信和协调
 */

import * as vscode from 'vscode';
import { PluginEvent, PluginEventType, EventListener, DisposableListener } from '../types';

export class EventManager {
  private static instance: EventManager;
  private listeners = new Map<PluginEventType, Set<EventListener<any>>>();
  private disposables: vscode.Disposable[] = [];

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 注册事件监听器
   */
  public on<T = any>(eventType: PluginEventType, listener: EventListener<T>): DisposableListener {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listenersSet = this.listeners.get(eventType)!;
    listenersSet.add(listener);

    // 返回可释放的监听器
    return {
      dispose: () => {
        listenersSet.delete(listener);
        if (listenersSet.size === 0) {
          this.listeners.delete(eventType);
        }
      },
    };
  }

  /**
   * 注册一次性事件监听器
   */
  public once<T = any>(eventType: PluginEventType, listener: EventListener<T>): DisposableListener {
    const disposable = this.on(eventType, event => {
      disposable.dispose();
      listener(event);
    });

    return disposable;
  }

  /**
   * 移除事件监听器
   */
  public off<T = any>(eventType: PluginEventType, listener?: EventListener<T>): void {
    const listenersSet = this.listeners.get(eventType);
    if (!listenersSet) {
      return;
    }

    if (listener) {
      listenersSet.delete(listener);
      if (listenersSet.size === 0) {
        this.listeners.delete(eventType);
      }
    } else {
      // 移除所有监听器
      this.listeners.delete(eventType);
    }
  }

  /**
   * 触发事件
   */
  public emit<T = any>(event: PluginEvent<T>): void {
    const listenersSet = this.listeners.get(event.type);
    if (!listenersSet) {
      return;
    }

    // 异步执行所有监听器
    setImmediate(() => {
      for (const listener of listenersSet) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      }
    });
  }

  /**
   * 同步触发事件
   */
  public emitSync<T = any>(event: PluginEvent<T>): void {
    const listenersSet = this.listeners.get(event.type);
    if (!listenersSet) {
      return;
    }

    for (const listener of listenersSet) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * 等待特定事件
   */
  public waitFor<T = any>(
    eventType: PluginEventType,
    timeout?: number,
    predicate?: (event: PluginEvent<T>) => boolean
  ): Promise<PluginEvent<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const disposable = this.on(eventType, (event: PluginEvent<T>) => {
        if (!predicate || predicate(event)) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          disposable.dispose();
          resolve(event);
        }
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          disposable.dispose();
          reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
      }
    });
  }

  /**
   * 获取事件监听器数量
   */
  public getListenerCount(eventType?: PluginEventType): number {
    if (eventType) {
      const listenersSet = this.listeners.get(eventType);
      return listenersSet ? listenersSet.size : 0;
    }

    let total = 0;
    for (const listenersSet of this.listeners.values()) {
      total += listenersSet.size;
    }
    return total;
  }

  /**
   * 获取所有事件类型
   */
  public getEventTypes(): PluginEventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 清除所有监听器
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.clear();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

// 事件工厂类
export class EventFactory {
  /**
   * 创建项目配置变更事件
   */
  static createProjectConfigChanged(config: any): PluginEvent<any> {
    return {
      type: PluginEventType.PROJECT_CONFIG_CHANGED,
      data: config,
      timestamp: Date.now(),
      source: 'ProjectDetector',
    };
  }

  /**
   * 创建ARB文件变更事件
   */
  static createArbFileChanged(
    locale: string,
    filePath: string
  ): PluginEvent<{ locale: string; filePath: string }> {
    return {
      type: PluginEventType.ARB_FILE_CHANGED,
      data: { locale, filePath },
      timestamp: Date.now(),
      source: 'ArbManager',
    };
  }

  /**
   * 创建翻译更新事件
   */
  static createTranslationUpdated(
    locale: string,
    key: string,
    oldValue: string | undefined,
    newValue: string
  ): PluginEvent<{ locale: string; key: string; oldValue?: string; newValue: string }> {
    return {
      type: PluginEventType.TRANSLATION_UPDATED,
      data: { locale, key, oldValue, newValue },
      timestamp: Date.now(),
      source: 'ArbManager',
    };
  }

  /**
   * 创建翻译删除事件
   */
  static createTranslationDeleted(
    locale: string,
    key: string,
    oldValue: string
  ): PluginEvent<{ locale: string; key: string; oldValue: string }> {
    return {
      type: PluginEventType.TRANSLATION_DELETED,
      data: { locale, key, oldValue },
      timestamp: Date.now(),
      source: 'ArbManager',
    };
  }

  /**
   * 创建翻译键创建事件
   */
  static createTranslationKeyCreated(
    key: string,
    translations: Map<string, string>
  ): PluginEvent<{ key: string; translations: Map<string, string> }> {
    return {
      type: PluginEventType.TRANSLATION_KEY_CREATED,
      data: { key, translations },
      timestamp: Date.now(),
      source: 'ArbManager',
    };
  }

  /**
   * 创建Dart文件解析事件
   */
  static createDartFileParsed(
    uri: string,
    references: any[]
  ): PluginEvent<{ uri: string; references: any[] }> {
    return {
      type: PluginEventType.DART_FILE_PARSED,
      data: { uri, references },
      timestamp: Date.now(),
      source: 'DartParser',
    };
  }

  /**
   * 创建诊断更新事件
   */
  static createDiagnosticsUpdated(
    uri: string,
    diagnostics: any[]
  ): PluginEvent<{ uri: string; diagnostics: any[] }> {
    return {
      type: PluginEventType.DIAGNOSTICS_UPDATED,
      data: { uri, diagnostics },
      timestamp: Date.now(),
      source: 'DiagnosticProvider',
    };
  }

  /**
   * 创建缓存清除事件
   */
  static createCacheCleared(keys?: string[]): PluginEvent<{ keys?: string[] }> {
    return {
      type: PluginEventType.CACHE_CLEARED,
      data: { keys },
      timestamp: Date.now(),
      source: 'CacheManager',
    };
  }

  /**
   * 创建插件配置变更事件
   */
  static createPluginConfigChanged(config: any): PluginEvent<any> {
    return {
      type: PluginEventType.PLUGIN_CONFIG_CHANGED,
      data: config,
      timestamp: Date.now(),
      source: 'ConfigManager',
    };
  }

  /**
   * 创建错误事件
   */
  static createError(
    error: Error,
    context?: string
  ): PluginEvent<{ error: Error; context?: string }> {
    return {
      type: PluginEventType.ERROR,
      data: { error, context },
      timestamp: Date.now(),
      source: context || 'Unknown',
    };
  }

  /**
   * 创建性能指标事件
   */
  static createPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: any
  ): PluginEvent<{ operation: string; duration: number; metadata?: any }> {
    return {
      type: PluginEventType.PERFORMANCE_METRIC,
      data: { operation, duration, metadata },
      timestamp: Date.now(),
      source: 'PerformanceMonitor',
    };
  }
}

// 事件聚合器
export class EventAggregator {
  private eventManager = getEventManager();
  private aggregatedEvents = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * 聚合事件
   */
  public aggregate<T>(
    eventType: PluginEventType,
    aggregateKey: string,
    delay = 1000
  ): DisposableListener {
    return this.eventManager.on<T>(eventType, event => {
      // 添加到聚合列表
      if (!this.aggregatedEvents.has(aggregateKey)) {
        this.aggregatedEvents.set(aggregateKey, []);
      }

      this.aggregatedEvents.get(aggregateKey)!.push(event);

      // 重置定时器
      if (this.timers.has(aggregateKey)) {
        clearTimeout(this.timers.get(aggregateKey)!);
      }

      this.timers.set(
        aggregateKey,
        setTimeout(() => {
          const events = this.aggregatedEvents.get(aggregateKey) || [];
          if (events.length > 0) {
            // 触发聚合事件
            this.eventManager.emit({
              type: `${eventType}_AGGREGATED` as PluginEventType,
              data: events,
              timestamp: Date.now(),
              source: 'EventAggregator',
            });

            // 清除聚合数据
            this.aggregatedEvents.delete(aggregateKey);
          }

          this.timers.delete(aggregateKey);
        }, delay)
      );
    });
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.aggregatedEvents.clear();
  }
}

// 事件中间件
export type EventMiddleware<T = any> = (
  event: PluginEvent<T>,
  next: (event: PluginEvent<T>) => void
) => void;

export class EventMiddlewareManager {
  private middlewares: EventMiddleware[] = [];

  /**
   * 添加中间件
   */
  public use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * 执行中间件链
   */
  public execute<T>(event: PluginEvent<T>, finalHandler: (event: PluginEvent<T>) => void): void {
    let index = 0;

    const next = (event: PluginEvent<T>) => {
      if (index >= this.middlewares.length) {
        finalHandler(event);
        return;
      }

      const middleware = this.middlewares[index++];
      middleware(event, next);
    };

    next(event);
  }
}

// 导出单例实例
export const getEventManager = (): EventManager => EventManager.getInstance();

// 常用事件监听器
export class CommonEventListeners {
  private eventManager = getEventManager();
  private disposables: DisposableListener[] = [];

  /**
   * 监听所有ARB文件变更
   */
  public onArbFileChanged(
    callback: (locale: string, filePath: string) => void
  ): DisposableListener {
    const disposable = this.eventManager.on(PluginEventType.ARB_FILE_CHANGED, event => {
      callback(event.data.locale, event.data.filePath);
    });

    this.disposables.push(disposable);
    return disposable;
  }

  /**
   * 监听翻译更新
   */
  public onTranslationUpdated(
    callback: (locale: string, key: string, oldValue: string | undefined, newValue: string) => void
  ): DisposableListener {
    const disposable = this.eventManager.on(PluginEventType.TRANSLATION_UPDATED, event => {
      callback(event.data.locale, event.data.key, event.data.oldValue, event.data.newValue);
    });

    this.disposables.push(disposable);
    return disposable;
  }

  /**
   * 监听项目配置变更
   */
  public onProjectConfigChanged(callback: (config: any) => void): DisposableListener {
    const disposable = this.eventManager.on(PluginEventType.PROJECT_CONFIG_CHANGED, event => {
      callback(event.data);
    });

    this.disposables.push(disposable);
    return disposable;
  }

  /**
   * 监听错误事件
   */
  public onError(callback: (error: Error, context?: string) => void): DisposableListener {
    const disposable = this.eventManager.on(PluginEventType.ERROR, event => {
      callback(event.data.error, event.data.context);
    });

    this.disposables.push(disposable);
    return disposable;
  }

  /**
   * 释放所有监听器
   */
  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

// 性能监控事件
export class PerformanceEventMonitor {
  private eventManager = getEventManager();

  /**
   * 监控方法执行时间
   */
  public monitor<T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        this.eventManager.emit(
          EventFactory.createPerformanceMetric(
            `${target.constructor.name}.${propertyName}`,
            duration,
            { args: args.length }
          )
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.eventManager.emit(
          EventFactory.createPerformanceMetric(
            `${target.constructor.name}.${propertyName}`,
            duration,
            { error: true, args: args.length }
          )
        );

        throw error;
      }
    } as any;

    return descriptor;
  }
}
