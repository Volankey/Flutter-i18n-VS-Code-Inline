/**
 * 缓存管理器
 * 提供高效的缓存机制以提升插件性能
 */

import * as vscode from 'vscode';
import { CacheEntry, CacheStats } from '../types';

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5分钟
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 设置缓存项
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTtl);

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * 获取缓存项
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value as T;
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存项
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * 清空指定前缀的缓存
   */
  public clearByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * 获取或设置缓存项（如果不存在则创建）
   */
  public async getOrSet<T>(key: string, factory: () => Promise<T> | T, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);

    return value;
  }

  /**
   * 批量获取缓存项
   */
  public getMultiple<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();

    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * 批量设置缓存项
   */
  public setMultiple<T>(entries: Map<string, T>, ttl?: number): void {
    for (const [key, value] of entries) {
      this.set(key, value, ttl);
    }
  }

  /**
   * 获取缓存统计信息
   */
  public getStats(): CacheStats {
    let totalSize = 0;
    let expiredCount = 0;
    let totalAccessCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      totalSize++;
      totalAccessCount += entry.accessCount;

      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    const validEntries = totalSize - expiredCount;

    return {
      size: totalSize,
      hits: totalAccessCount,
      misses: 0, // 这个需要在实际使用中跟踪
      hitRate: totalAccessCount > 0 ? validEntries / totalSize : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * 清理过期的缓存项
   */
  public cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * 启动定期清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 每分钟清理一次过期项
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * 停止清理定时器
   */
  public stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 估算内存使用量（字节）
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache) {
      // 估算键的大小
      totalSize += key.length * 2; // UTF-16

      // 估算值的大小（简单估算）
      totalSize += this.estimateValueSize(entry.value);

      // 估算元数据大小
      totalSize += 64; // 大致的对象开销
    }

    return totalSize;
  }

  /**
   * 估算值的大小
   */
  private estimateValueSize(value: any): number {
    if (value === null || value === undefined) {
      return 8;
    }

    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }

    if (typeof value === 'number') {
      return 8;
    }

    if (typeof value === 'boolean') {
      return 4;
    }

    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateValueSize(item), 0) + 24;
    }

    if (typeof value === 'object') {
      let size = 24; // 对象开销
      for (const [key, val] of Object.entries(value)) {
        size += key.length * 2; // 键
        size += this.estimateValueSize(val); // 值
      }
      return size;
    }

    return 32; // 默认估算
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// 缓存键常量
export const CacheKeys = {
  // 项目相关
  PROJECT_CONFIG: 'project:config',
  PROJECT_L10N_CONFIG: 'project:l10n_config',
  PROJECT_PUBSPEC: 'project:pubspec',

  // ARB 文件相关
  ARB_FILE: (locale: string) => `arb:file:${locale}`,
  ARB_CONTENT: (locale: string) => `arb:content:${locale}`,
  ARB_KEYS: 'arb:all_keys',
  ARB_TRANSLATIONS: (key: string) => `arb:translations:${key}`,

  // Dart 解析相关
  DART_REFERENCES: (uri: string) => `dart:references:${uri}`,
  DART_PARSE_RESULT: (uri: string, version: number) => `dart:parse:${uri}:${version}`,

  // 诊断相关
  DIAGNOSTICS: (uri: string) => `diagnostics:${uri}`,

  // 统计相关
  TRANSLATION_STATS: 'stats:translations',
  LOCALE_STATS: (locale: string) => `stats:locale:${locale}`,

  // 配置相关
  PLUGIN_CONFIG: 'plugin:config',

  // 文件监听相关
  FILE_WATCHER: (pattern: string) => `watcher:${pattern}`,
} as const;

// 缓存 TTL 常量（毫秒）
export const CacheTTL = {
  SHORT: 30 * 1000, // 30秒
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 30 * 60 * 1000, // 30分钟
  VERY_LONG: 2 * 60 * 60 * 1000, // 2小时
} as const;

// 导出单例实例
export const getCacheManager = (): CacheManager => CacheManager.getInstance();

/**
 * 缓存装饰器
 * 用于自动缓存方法结果
 */
export function cached(key: string | ((args: any[]) => string), ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheManager();
      const cacheKey = typeof key === 'string' ? key : key(args);

      // 尝试从缓存获取
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await method.apply(this, args);

      // 缓存结果
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * 缓存失效装饰器
 * 用于在方法执行后清除相关缓存
 */
export function invalidateCache(keys: string[] | ((args: any[]) => string[])) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      const cache = getCacheManager();
      const keysToInvalidate = typeof keys === 'function' ? keys(args) : keys;

      for (const key of keysToInvalidate) {
        if (key.includes('*')) {
          // 支持通配符
          const prefix = key.replace('*', '');
          cache.clearByPrefix(prefix);
        } else {
          cache.delete(key);
        }
      }

      return result;
    };

    return descriptor;
  };
}
