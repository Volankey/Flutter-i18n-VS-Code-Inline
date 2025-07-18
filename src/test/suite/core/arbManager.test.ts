import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ArbManager } from '../../../core/arbManager';
import { ProjectConfig } from '../../../types';

suite('ArbManager Test Suite', () => {
  const testDir = path.join(__dirname, 'test_temp');
  const l10nDir = path.join(testDir, 'lib', 'l10n');

  setup(() => {
    // Create test directories
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(l10nDir)) {
      fs.mkdirSync(l10nDir, { recursive: true });
    }

    // Create l10n.yaml
    const l10nConfig = `
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
`;
    fs.writeFileSync(path.join(testDir, 'l10n.yaml'), l10nConfig);

    // Create sample arb files
    const enArb = {
      hello: 'Hello',
      world: 'World',
    };
    fs.writeFileSync(path.join(l10nDir, 'app_en.arb'), JSON.stringify(enArb, null, 2));

    const zhArb = {
      hello: '你好',
    };
    fs.writeFileSync(path.join(l10nDir, 'app_zh.arb'), JSON.stringify(zhArb, null, 2));
  });

  teardown(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should initialize and load arb files correctly', async () => {
    const projectConfig: ProjectConfig = {
      isFlutterProject: true,
      arbDirectory: l10nDir,
      templateArbFile: 'app_en.arb',
      supportedLocales: ['en', 'zh'],
      defaultLocale: 'en',
      generatedDir: path.join(testDir, 'generated'),
    };
    assert.ok(projectConfig, 'Project config should be loaded');

    const arbManager = ArbManager.getInstance();
    await arbManager.initialize(projectConfig!);

    const enFile = arbManager.getArbFile('en');
    assert.ok(enFile, 'English arb file should be loaded');
    assert.strictEqual(enFile.entries.get('hello')?.value, 'Hello');
    assert.strictEqual(enFile.entries.get('world')?.value, 'World');

    const zhFile = arbManager.getArbFile('zh');
    assert.ok(zhFile, 'Chinese arb file should be loaded');
    assert.strictEqual(zhFile.entries.get('hello')?.value, '你好');
  });

  test('should update translation key', async () => {
    const projectConfig: ProjectConfig = {
      isFlutterProject: true,
      arbDirectory: l10nDir,
      templateArbFile: 'app_en.arb',
      supportedLocales: ['en', 'zh'],
      defaultLocale: 'en',
      generatedDir: path.join(testDir, 'generated'),
    };
    assert.ok(projectConfig, 'Project config should be loaded');

    const arbManager = ArbManager.getInstance();
    await arbManager.initialize(projectConfig!);

    await arbManager.setTranslation('hello', 'en', 'Hello Updated');
    const enFile = arbManager.getArbFile('en');
    assert.ok(enFile, 'English arb file should exist');
    assert.strictEqual(enFile.entries.get('hello')?.value, 'Hello Updated');

    // Verify file is updated
    const updatedEnArb = JSON.parse(fs.readFileSync(path.join(l10nDir, 'app_en.arb'), 'utf-8'));
    assert.strictEqual(updatedEnArb.hello, 'Hello Updated');
  });

  test('should add new translation key', async () => {
    const projectConfig: ProjectConfig = {
      isFlutterProject: true,
      arbDirectory: l10nDir,
      templateArbFile: 'app_en.arb',
      supportedLocales: ['en', 'zh'],
      defaultLocale: 'en',
      generatedDir: path.join(testDir, 'generated'),
    };
    assert.ok(projectConfig, 'Project config should be loaded');

    const arbManager = ArbManager.getInstance();
    await arbManager.initialize(projectConfig!);

    await arbManager.setTranslation('newKey', 'zh', 'New Value');
    const zhFile = arbManager.getArbFile('zh');
    assert.ok(zhFile, 'Chinese arb file should exist');
    assert.strictEqual(zhFile.entries.get('newKey')?.value, 'New Value');

    // Verify file is updated
    const updatedZhArb = JSON.parse(fs.readFileSync(path.join(l10nDir, 'app_zh.arb'), 'utf-8'));
    assert.strictEqual(updatedZhArb.newKey, 'New Value');
  });
});
