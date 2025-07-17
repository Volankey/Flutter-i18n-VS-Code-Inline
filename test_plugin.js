#!/usr/bin/env node

/**
 * 插件功能测试脚本
 * 用于验证Flutter i18n VSCode插件的核心功能
 */

const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  projectRoot: '/Users/hakusakaitekimac/Documents/flutter-i18n-scanner/Flutter-i18n-VsCode-Inline/example',
  pluginRoot: '/Users/hakusakaitekimac/Documents/flutter-i18n-scanner/Flutter-i18n-VsCode-Inline',
  expectedFiles: {
    pubspec: 'pubspec.yaml',
    l10nConfig: 'l10n.yaml',
    arbFiles: ['lib/l10n/app_en.arb', 'lib/l10n/app_zh.arb', 'lib/l10n/app_ja.arb', 'lib/l10n/app_es.arb'],
    dartFiles: ['lib/main.dart', 'lib/screens/home_screen.dart'],
    pluginDist: 'dist/extension.js'
  }
};

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * 运行测试
 */
function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const result = testFn();
    if (result) {
      console.log(`✅ PASSED: ${name}`);
      testResults.passed++;
    } else {
      console.log(`❌ FAILED: ${name}`);
      testResults.failed++;
    }
    testResults.tests.push({ name, passed: result });
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, passed: false, error: error.message });
  }
}

/**
 * 检查文件是否存在
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 读取JSON文件
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * 读取文本文件
 */
function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * 测试1: 检查插件构建文件
 */
function testPluginBuild() {
  const distPath = path.join(TEST_CONFIG.pluginRoot, TEST_CONFIG.expectedFiles.pluginDist);
  const exists = fileExists(distPath);
  
  if (exists) {
    const stats = fs.statSync(distPath);
    console.log(`   📦 Plugin size: ${(stats.size / 1024).toFixed(2)} KB`);
    return stats.size > 0;
  }
  
  return false;
}

/**
 * 测试2: 检查Flutter项目结构
 */
function testFlutterProjectStructure() {
  const pubspecPath = path.join(TEST_CONFIG.projectRoot, TEST_CONFIG.expectedFiles.pubspec);
  const l10nConfigPath = path.join(TEST_CONFIG.projectRoot, TEST_CONFIG.expectedFiles.l10nConfig);
  
  const pubspecExists = fileExists(pubspecPath);
  const l10nConfigExists = fileExists(l10nConfigPath);
  
  if (pubspecExists) {
    const pubspec = readTextFile(pubspecPath);
    const hasFlutterLocalizations = pubspec && pubspec.includes('flutter_localizations');
    console.log(`   📄 pubspec.yaml: ✓`);
    console.log(`   🌐 flutter_localizations: ${hasFlutterLocalizations ? '✓' : '❌'}`);
  }
  
  if (l10nConfigExists) {
    console.log(`   ⚙️  l10n.yaml: ✓`);
  }
  
  return pubspecExists && l10nConfigExists;
}

/**
 * 测试3: 检查ARB文件
 */
function testArbFiles() {
  let allExist = true;
  let totalKeys = 0;
  const arbData = {};
  
  for (const arbFile of TEST_CONFIG.expectedFiles.arbFiles) {
    const arbPath = path.join(TEST_CONFIG.projectRoot, arbFile);
    const exists = fileExists(arbPath);
    
    if (exists) {
      const arbContent = readJsonFile(arbPath);
      if (arbContent) {
        const locale = path.basename(arbFile, '.arb').split('_')[1];
        const keys = Object.keys(arbContent).filter(key => !key.startsWith('@') && key !== '@@locale');
        arbData[locale] = keys;
        totalKeys = Math.max(totalKeys, keys.length);
        console.log(`   🌍 ${locale}: ${keys.length} keys`);
      }
    } else {
      allExist = false;
      console.log(`   ❌ Missing: ${arbFile}`);
    }
  }
  
  console.log(`   📊 Total translation keys: ${totalKeys}`);
  
  // 检查翻译完整性
  const locales = Object.keys(arbData);
  if (locales.length > 1) {
    const baseKeys = arbData[locales[0]] || [];
    for (let i = 1; i < locales.length; i++) {
      const currentKeys = arbData[locales[i]] || [];
      const missingKeys = baseKeys.filter(key => !currentKeys.includes(key));
      if (missingKeys.length > 0) {
        console.log(`   ⚠️  ${locales[i]} missing ${missingKeys.length} keys: ${missingKeys.slice(0, 3).join(', ')}${missingKeys.length > 3 ? '...' : ''}`);
      }
    }
  }
  
  return allExist && totalKeys > 0;
}

/**
 * 测试4: 检查Dart文件中的国际化使用
 */
function testDartI18nUsage() {
  let foundI18nUsage = false;
  let totalI18nCalls = 0;
  
  for (const dartFile of TEST_CONFIG.expectedFiles.dartFiles) {
    const dartPath = path.join(TEST_CONFIG.projectRoot, dartFile);
    const exists = fileExists(dartPath);
    
    if (exists) {
      const dartContent = readTextFile(dartPath);
      if (dartContent) {
        // 查找 AppLocalizations 的使用
        const l10nMatches = dartContent.match(/l10n\.[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        const appLocalizationsMatches = dartContent.match(/AppLocalizations\.of\(context\)!?\.[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        
        const fileI18nCalls = l10nMatches.length + appLocalizationsMatches.length;
        totalI18nCalls += fileI18nCalls;
        
        if (fileI18nCalls > 0) {
          foundI18nUsage = true;
          console.log(`   📝 ${dartFile}: ${fileI18nCalls} i18n calls`);
          
          // 显示一些示例
          const examples = [...l10nMatches, ...appLocalizationsMatches].slice(0, 3);
          examples.forEach(example => {
            console.log(`      - ${example}`);
          });
        }
      }
    }
  }
  
  console.log(`   📊 Total i18n calls found: ${totalI18nCalls}`);
  return foundI18nUsage && totalI18nCalls > 0;
}

/**
 * 测试5: 检查插件配置
 */
function testPluginConfiguration() {
  const packageJsonPath = path.join(TEST_CONFIG.pluginRoot, 'package.json');
  const packageJson = readJsonFile(packageJsonPath);
  
  if (!packageJson) {
    return false;
  }
  
  const hasCorrectMain = packageJson.main === './dist/extension.js';
  const hasVscodeEngine = packageJson.engines && packageJson.engines.vscode;
  const hasContributes = packageJson.contributes;
  
  console.log(`   📦 Package name: ${packageJson.name}`);
  console.log(`   🔧 Main entry: ${packageJson.main} ${hasCorrectMain ? '✓' : '❌'}`);
  console.log(`   🎯 VSCode engine: ${packageJson.engines?.vscode || 'none'} ${hasVscodeEngine ? '✓' : '❌'}`);
  console.log(`   ⚙️  Contributes: ${hasContributes ? '✓' : '❌'}`);
  
  return hasCorrectMain && hasVscodeEngine && hasContributes;
}

/**
 * 主测试函数
 */
function main() {
  console.log('🚀 Flutter i18n VSCode Plugin Test Suite');
  console.log('=' .repeat(50));
  
  // 运行所有测试
  runTest('Plugin Build', testPluginBuild);
  runTest('Flutter Project Structure', testFlutterProjectStructure);
  runTest('ARB Files', testArbFiles);
  runTest('Dart i18n Usage', testDartI18nUsage);
  runTest('Plugin Configuration', testPluginConfiguration);
  
  // 显示测试结果
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! The plugin should be working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Open VSCode with the extension development host');
    console.log('   2. Open the example Flutter project');
    console.log('   3. Check for CodeLens, hover tooltips, and diagnostics on i18n calls');
    console.log('   4. Try the "Hello World" command from the command palette');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { runTest, testResults };