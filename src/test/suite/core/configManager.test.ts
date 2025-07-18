import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from '../../../core/configManager';

suite('ConfigManager Test Suite', () => {
  let originalGetConfiguration: any;

  setup(() => {
    // 保存原始的 getConfiguration 方法
    originalGetConfiguration = vscode.workspace.getConfiguration;
  });

  teardown(() => {
    // 恢复原始的 getConfiguration 方法
    vscode.workspace.getConfiguration = originalGetConfiguration;
  });

  test('should load VS Code extension configuration', () => {
    const configManager = ConfigManager.getInstance();

    // Mocking getConfiguration
    const mockConfig = {
      get: (key: string, defaultValue?: any) => {
        console.log(`Mock config.get called with key: ${key}, defaultValue:`, defaultValue);
        switch (key) {
          case 'inlinePreview.enabled':
            return true;
          case 'inlinePreview.languages':
            return ['fr'];
          case 'hoverPreview.enabled':
            return false;
          // 为其他配置项提供默认值，避免返回undefined
          case 'inlinePreview.maxLength':
            return 50;
          case 'inlinePreview.showIcon':
            return true;
          case 'inlinePreview.showStatus':
            return true;
          case 'inlinePreview.position':
            return 'after';
          default:
            return defaultValue;
        }
      },
    };

    // 替换 getConfiguration 方法
    const originalGetConfiguration = vscode.workspace.getConfiguration;
    vscode.workspace.getConfiguration = (section?: string) => {
      console.log(`Mock getConfiguration called with section: ${section}`);
      if (section === 'flutter-i18n-vscode-inline') {
        return mockConfig as any;
      }
      return originalGetConfiguration(section);
    };

    // 清除缓存以确保重新加载配置
    configManager.clearCache();

    const config = configManager.getConfiguration();

    assert.strictEqual(config.inlinePreview.enabled, true);
    assert.deepStrictEqual(config.inlinePreview.languages, ['fr']);
    assert.strictEqual(config.hoverPreview.enabled, false);
  });
});
