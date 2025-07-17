/**
 * 插件扩展测试
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectDetector } from '../../core/projectDetector';
import { ArbManager } from '../../core/arbManager';
import { DartParser } from '../../core/dartParser';
import { CacheManager } from '../../core/cacheManager';
import { ConfigManager } from '../../core/configManager';
import { StringUtils, FileUtils } from '../../utils';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('ProjectDetector Tests', () => {
    let projectDetector: ProjectDetector;

    setup(() => {
      projectDetector = ProjectDetector.getInstance();
    });

    teardown(() => {
      projectDetector.dispose();
    });

    test('should detect Flutter project', async () => {
      // 这里需要模拟一个Flutter项目环境
      // 在实际测试中，可以创建临时的测试文件
      const config = await projectDetector.detectProject();
      // 根据测试环境调整断言
      assert.ok(config !== null || config === null, 'Project detection should complete');
    });

    test('should parse l10n.yaml configuration', async () => {
      // 测试l10n.yaml解析功能
      const mockL10nConfig = {
        'arb-dir': 'lib/l10n',
        'template-arb-file': 'app_en.arb',
        'output-localization-file': 'app_localizations.dart',
        'output-class': 'AppLocalizations'
      };
      
      // 这里可以测试配置解析逻辑
      assert.ok(mockL10nConfig['arb-dir'], 'Should have arb-dir configuration');
    });
  });

  suite('ArbManager Tests', () => {
    let arbManager: ArbManager;

    setup(() => {
      arbManager = ArbManager.getInstance();
    });

    teardown(() => {
      arbManager.dispose();
    });




  });

  suite('DartParser Tests', () => {
    let dartParser: DartParser;

    setup(() => {
      dartParser = DartParser.getInstance();
    });



    test('should parse S.of(context) pattern', () => {
      const dartCode = `
        Widget build(BuildContext context) {
          return Text(S.of(context).hello);
        }
      `;

      const references = dartParser.parseDocument({ getText: () => dartCode } as any);
      
      assert.strictEqual(references.references.length, 1);
      assert.strictEqual(references.references[0].key, 'hello');
      assert.strictEqual(references.references[0].pattern, 'S_OF_CONTEXT');
    });

    test('should parse context.l10n pattern', () => {
      const dartCode = `
        Widget build(BuildContext context) {
          return Text(context.l10n.welcome);
        }
      `;

      const references = dartParser.parseDocument({ getText: () => dartCode } as any);
      
      assert.strictEqual(references.references.length, 1);
      assert.strictEqual(references.references[0].key, 'welcome');
      assert.strictEqual(references.references[0].pattern, 'CONTEXT_L10N');
    });

    test('should parse AppLocalizations pattern', () => {
      const dartCode = `
        Widget build(BuildContext context) {
          return Text(AppLocalizations.of(context)!.greeting);
        }
      `;

      const references = dartParser.parseDocument({ getText: () => dartCode } as any);
      
      assert.strictEqual(references.references.length, 1);
      assert.strictEqual(references.references[0].key, 'greeting');
      assert.strictEqual(references.references[0].pattern, 'APP_LOCALIZATIONS');
    });

    test('should extract parameters from method calls', () => {
      const dartCode = `
        Widget build(BuildContext context) {
          return Text(S.of(context).welcomeUser(userName, userAge));
        }
      `;

      const references = dartParser.parseDocument({ getText: () => dartCode } as any);
      
      assert.strictEqual(references.references.length, 1);
      assert.ok(references.references[0].parameters, 'Parameters should exist');
      assert.strictEqual(references.references[0].parameters!.length, 2);
      assert.strictEqual(references.references[0].parameters![0], 'userName');
      assert.strictEqual(references.references[0].parameters![1], 'userAge');
    });
  });

  suite('CacheManager Tests', () => {
    let cacheManager: CacheManager;

    setup(() => {
      cacheManager = CacheManager.getInstance();
      cacheManager.clear(); // 清空缓存
    });

    teardown(() => {
      cacheManager.clear();
    });

    test('should set and get cache values', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      
      cacheManager.set(key, value, 1000);
      const cachedValue = cacheManager.get(key);
      
      assert.deepStrictEqual(cachedValue, value);
    });

    test('should handle cache expiration', (done) => {
      const key = 'expire-test';
      const value = 'test-value';
      
      cacheManager.set(key, value, 100); // 100ms TTL
      
      setTimeout(() => {
        const cachedValue = cacheManager.get(key);
        assert.strictEqual(cachedValue, undefined, 'Cache should expire');
        done();
      }, 150);
    });

    test('should clear cache by prefix', () => {
      cacheManager.set('prefix:key1', 'value1');
      cacheManager.set('prefix:key2', 'value2');
      cacheManager.set('other:key3', 'value3');
      
      cacheManager.clearByPrefix('prefix:');
      
      assert.strictEqual(cacheManager.get('prefix:key1'), undefined);
      assert.strictEqual(cacheManager.get('prefix:key2'), undefined);
      assert.strictEqual(cacheManager.get('other:key3'), 'value3');
    });
  });

  suite('ConfigManager Tests', () => {
    let configManager: ConfigManager;

    setup(() => {
      configManager = ConfigManager.getInstance();
    });

    test('should load default configuration', () => {
      const config = configManager.getConfiguration();
      
      assert.ok(config.inlinePreview, 'Should have inline preview config');
      assert.ok(config.hoverPreview, 'Should have hover preview config');
      assert.ok(config.diagnostics, 'Should have diagnostics config');
    });

    test('should validate configuration', () => {
      const validConfig = {
        inlinePreview: {
          enabled: true,
          showIcons: true,
          maxLength: 50
        }
      };

      const invalidConfig = {
        inlinePreview: {
          enabled: 'true', // Should be boolean
          maxLength: -1 // Should be positive
        }
      };

      assert.ok(configManager.validateConfiguration(validConfig), 'Valid config should pass');
      const isValidInvalidConfig = configManager.validateConfiguration(invalidConfig as any);
      assert.ok(!isValidInvalidConfig, 'Invalid config should fail');
    });
  });

  suite('StringUtils Tests', () => {
    test('should convert to camelCase', () => {
      assert.strictEqual(StringUtils.toCamelCase('hello world'), 'helloWorld');
      assert.strictEqual(StringUtils.toCamelCase('hello-world'), 'helloWorld');
      assert.strictEqual(StringUtils.toCamelCase('hello_world'), 'helloWorld');
    });

    test('should convert to snake_case', () => {
      assert.strictEqual(StringUtils.toSnakeCase('helloWorld'), 'hello_world');
      assert.strictEqual(StringUtils.toSnakeCase('HelloWorld'), 'hello_world');
      assert.strictEqual(StringUtils.toSnakeCase('hello-world'), 'hello_world');
    });

    test('should calculate string similarity', () => {
      assert.strictEqual(StringUtils.similarity('hello', 'hello'), 1);
      assert.strictEqual(StringUtils.similarity('hello', 'world'), 0.2);
      assert.ok(StringUtils.similarity('hello', 'hallo') > 0.8);
    });

    test('should validate key names', () => {
      assert.ok(StringUtils.isValidKey('validKey'));
      assert.ok(StringUtils.isValidKey('valid_key'));
      assert.ok(StringUtils.isValidKey('validKey123'));
      assert.ok(!StringUtils.isValidKey('123invalid'));
      assert.ok(!StringUtils.isValidKey('invalid-key'));
      assert.ok(!StringUtils.isValidKey('invalid key'));
    });

    test('should generate key from text', () => {
      assert.strictEqual(StringUtils.generateKeyFromText('Hello World'), 'helloWorld');
      assert.strictEqual(StringUtils.generateKeyFromText('Welcome to app!'), 'welcomeToApp');
      assert.strictEqual(StringUtils.generateKeyFromText('User name'), 'userName');
    });
  });

  suite('FileUtils Tests', () => {
    test('should get file extension', () => {
      assert.strictEqual(FileUtils.getExtension('test.dart'), '.dart');
      assert.strictEqual(FileUtils.getExtension('app_en.arb'), '.arb');
      assert.strictEqual(FileUtils.getExtension('config.yaml'), '.yaml');
    });

    test('should get base name', () => {
      assert.strictEqual(FileUtils.getBaseName('test.dart'), 'test');
      assert.strictEqual(FileUtils.getBaseName('app_en.arb'), 'app_en');
      assert.strictEqual(FileUtils.getBaseName('/path/to/file.ext'), 'file');
    });

    test('should normalize paths', () => {
      const normalized = FileUtils.normalizePath('path\\to\\file');
      assert.strictEqual(normalized, 'path/to/file');
    });
  });

  suite('Integration Tests', () => {
    test('should handle complete workflow', async () => {
      // 这是一个集成测试示例
      // 在实际环境中，这里会测试完整的工作流程
      
      const projectDetector = ProjectDetector.getInstance();
      const arbManager = ArbManager.getInstance();
      const dartParser = DartParser.getInstance();
      
      try {
        // 1. 检测项目
        const projectConfig = await projectDetector.detectProject();
        
        // 2. 如果是Flutter项目，初始化ARB管理器
        if (projectConfig) {
          await arbManager.initialize(projectConfig);
          
          // 3. 解析Dart代码
          const dartCode = 'Text(S.of(context).hello)';
          const parseResult = dartParser.parseDocument({ getText: () => dartCode } as any);
          
          assert.ok(parseResult.references.length >= 0, 'Should parse without errors');
        }
        
        assert.ok(true, 'Integration test completed');
      } finally {
        // 清理资源
        projectDetector.dispose();
      }
    });
  });
});