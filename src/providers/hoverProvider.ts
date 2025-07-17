/**
 * 悬停提供器
 * 在鼠标悬停时显示多语言翻译预览
 */

import * as vscode from 'vscode';
import { getDartParser } from '../core/dartParser';
import { getArbManager } from '../core/arbManager';
import { getProjectDetector } from '../core/projectDetector';
import { I18nReference, ArbEntry, TranslationStatus, ArbPlaceholder } from '../types';

export class I18nHoverProvider implements vscode.HoverProvider {
  protected dartParser = getDartParser();
  protected arbManager = getArbManager();
  protected projectDetector = getProjectDetector();

  /**
   * 提供悬停信息
   */
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | null {
    // 检查是否为 Dart 文件
    if (document.languageId !== 'dart') {
      return null;
    }

    // 检查是否启用悬停
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    if (!config.get('enableHover', true)) {
      return null;
    }

    // 检查项目配置
    const projectConfig = this.projectDetector.getProjectConfig();
    if (!projectConfig) {
      return null;
    }

    try {
      // 获取当前位置的 i18n 引用
      const reference = this.dartParser.getReferenceAtPosition(document, position);
      if (!reference || !reference.isValid) {
        return null;
      }

      // 创建悬停内容
      const hoverContent = this.createHoverContent(reference);
      if (!hoverContent) {
        return null;
      }

      return new vscode.Hover(hoverContent, reference.range);
    } catch (error) {
      console.error('Error providing hover:', error);
      return null;
    }
  }

  /**
   * 创建悬停内容
   */
  protected createHoverContent(reference: I18nReference): vscode.MarkdownString | null {
    const translations = this.arbManager.getAllTranslations(reference.key);
    const status = this.getTranslationStatus(reference.key, translations);
    
    if (status === TranslationStatus.MISSING) {
      return this.createMissingTranslationHover(reference.key);
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // 添加突出的翻译预览（放在最顶部）
    this.addTranslationPreview(markdown, translations);

    // 添加标题
    const statusIcon = this.getStatusIcon(status);
    markdown.appendMarkdown(`### ${statusIcon} Translation Key: \`${reference.key}\`\n\n`);

    // 添加详细翻译内容
    this.addTranslationsToMarkdown(markdown, translations, reference.key);

    // 添加参数信息
    this.addParametersToMarkdown(markdown, reference);

    // 添加统计信息
    this.addStatisticsToMarkdown(markdown, translations);

    // 添加操作按钮
    this.addActionsToMarkdown(markdown, reference.key);

    return markdown;
  }

  /**
   * 创建缺失翻译的悬停内容
   */
  private createMissingTranslationHover(key: string): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    
    markdown.appendMarkdown(`### ❌ Missing Translation: \`${key}\`\n\n`);
    markdown.appendMarkdown('This translation key is not found in any ARB files.\n\n');
    
    // 添加创建按钮
    const createCommand = `command:flutter-i18n-vscode-inline.createTranslation?${encodeURIComponent(JSON.stringify([key]))}`;
    markdown.appendMarkdown(`[$(plus) Create Translation](${createCommand})\n\n`);
    
    return markdown;
  }

  /**
   * 添加突出的翻译预览（显示在最顶部）
   */
  private addTranslationPreview(
    markdown: vscode.MarkdownString,
    translations: Map<string, string>
  ): void {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    
    // 检查是否启用翻译预览功能
    const showPreview = config.get('showTranslationPreview', true);
    if (!showPreview) {
      return;
    }
    
    // 获取主要翻译（优先显示配置的语言）
    const sortedTranslations = this.sortTranslations(translations);
    const primaryTranslation = sortedTranslations[0];
    
    if (!primaryTranslation) {
      return;
    }
    
    const [locale, translation] = primaryTranslation;
    const flagEmoji = this.getLocaleFlag(locale);
    const localeName = this.getLocaleName(locale);
    const escapedTranslation = this.escapeMarkdown(translation);
    
    // 使用超级醒目的 Markdown 样式
    markdown.appendMarkdown('\n');
    markdown.appendMarkdown('# 🎯 **TRANSLATION PREVIEW**\n\n');
    
    // 使用超大号字体和醒目的背景色块显示翻译
    markdown.appendMarkdown('## ');
    markdown.appendMarkdown(`${flagEmoji} \`\`\`\n${escapedTranslation}\n\`\`\`\n\n`);
    
    // 显示语言信息，使用醒目的格式
    markdown.appendMarkdown(`### 📍 **${localeName}** (${locale})\n\n`);
    
    // 如果有多个翻译，显示醒目的提示
    if (translations.size > 1) {
      markdown.appendMarkdown(`> ### 📚 **+${translations.size - 1} MORE TRANSLATIONS BELOW** ⬇️\n\n`);
    }
    
    markdown.appendMarkdown('---\n\n');
  }

  /**
   * 添加翻译内容到 Markdown
   */
  private addTranslationsToMarkdown(
    markdown: vscode.MarkdownString, 
    translations: Map<string, string>,
    key: string
  ): void {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const maxLanguages = config.get('hoverMaxLanguages', 5);
    const showAllLanguages = config.get('hoverShowAllLanguages', false);
    
    const sortedTranslations = this.sortTranslations(translations);
    
    // 如果只有一个翻译，不需要显示详细列表（已在预览中显示）
    if (translations.size <= 1) {
      return;
    }
    
    const displayTranslations = showAllLanguages ? 
      sortedTranslations : 
      sortedTranslations.slice(0, maxLanguages);

    markdown.appendMarkdown('#### All Translations:\n\n');
    
    for (const [locale, translation] of displayTranslations) {
      const flagEmoji = this.getLocaleFlag(locale);
      const localeName = this.getLocaleName(locale);
      const escapedTranslation = this.escapeMarkdown(translation);
      
      markdown.appendMarkdown(`**${flagEmoji} ${localeName} (${locale}):**\n`);
      markdown.appendMarkdown(`> ${escapedTranslation}\n\n`);
    }

    // 如果有更多翻译，显示省略信息
    if (!showAllLanguages && sortedTranslations.length > maxLanguages) {
      const remainingCount = sortedTranslations.length - maxLanguages;
      markdown.appendMarkdown(`*... and ${remainingCount} more languages*\n\n`);
      
      const showAllCommand = `command:flutter-i18n-vscode-inline.showAllTranslations?${encodeURIComponent(JSON.stringify([key]))}`;
      markdown.appendMarkdown(`[$(eye) Show All Languages](${showAllCommand})\n\n`);
    }
  }

  /**
   * 添加参数信息到 Markdown
   */
  private addParametersToMarkdown(markdown: vscode.MarkdownString, reference: I18nReference): void {
    if (!reference.parameters || reference.parameters.length === 0) {
      return;
    }

    markdown.appendMarkdown('#### Parameters:\n\n');
    
    for (const param of reference.parameters) {
      markdown.appendMarkdown(`- \`${param}\`: String`);
      markdown.appendMarkdown('\n');
    }
    
    markdown.appendMarkdown('\n');

    // 获取参数定义（从 ARB 文件）
    const arbEntry = this.getArbEntry(reference.key);
    
    if (arbEntry && arbEntry.placeholders && Object.keys(arbEntry.placeholders).length > 0) {
      markdown.appendMarkdown('#### ARB Placeholders:\n\n');
      
      for (const [name, placeholder] of Object.entries(arbEntry.placeholders)) {
        markdown.appendMarkdown(`- \`${name}\``);
        if (placeholder.type) {
          markdown.appendMarkdown(`: ${placeholder.type}`);
        }
        if (placeholder.description) {
          markdown.appendMarkdown(` - ${this.escapeMarkdown(placeholder.description)}`);
        }
        markdown.appendMarkdown('\n');
      }
      
      markdown.appendMarkdown('\n');
    }
  }

  /**
   * 添加统计信息到 Markdown
   */
  private addStatisticsToMarkdown(
    markdown: vscode.MarkdownString, 
    translations: Map<string, string>
  ): void {
    const totalLocales = this.arbManager.getArbFiles().size;
    const translatedLocales = translations.size;
    const missingLocales = totalLocales - translatedLocales;
    
    const completionPercentage = totalLocales > 0 ? 
      Math.round((translatedLocales / totalLocales) * 100) : 0;
    
    markdown.appendMarkdown('#### Statistics:\n\n');
    markdown.appendMarkdown(`- **Completion:** ${completionPercentage}% (${translatedLocales}/${totalLocales} languages)\n`);
    
    if (missingLocales > 0) {
      const missingLocalesList = this.getMissingLocales(translations);
      markdown.appendMarkdown(`- **Missing in:** ${missingLocalesList.join(', ')}\n`);
    }
    
    markdown.appendMarkdown('\n');
  }

  /**
   * 添加操作按钮到 Markdown
   */
  private addActionsToMarkdown(markdown: vscode.MarkdownString, key: string): void {
    markdown.appendMarkdown('#### Actions:\n\n');
    
    // 编辑翻译
    const editCommand = `command:flutter-i18n-vscode-inline.editTranslation?${encodeURIComponent(JSON.stringify([key]))}`;
    markdown.appendMarkdown(`[$(edit) Edit Translations](${editCommand}) `);
    
    // 复制键名
    const copyCommand = `command:flutter-i18n-vscode-inline.copyKey?${encodeURIComponent(JSON.stringify([key]))}`;
    markdown.appendMarkdown(`[$(copy) Copy Key](${copyCommand}) `);
    
    // 查找用法
    const findCommand = `command:flutter-i18n-vscode-inline.findUsages?${encodeURIComponent(JSON.stringify([key]))}`;
    markdown.appendMarkdown(`[$(search) Find Usages](${findCommand})\n\n`);
  }

  /**
   * 获取翻译状态
   */
  private getTranslationStatus(key: string, translations: Map<string, string>): TranslationStatus {
    const totalLocales = this.arbManager.getArbFiles().size;
    const translatedLocales = translations.size;
    
    if (translatedLocales === 0) {
      return TranslationStatus.MISSING;
    } else if (translatedLocales < totalLocales) {
      return TranslationStatus.PARTIAL;
    } else {
      return TranslationStatus.COMPLETE;
    }
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: TranslationStatus): string {
    switch (status) {
      case TranslationStatus.COMPLETE:
        return '✅';
      case TranslationStatus.PARTIAL:
        return '⚠️';
      case TranslationStatus.MISSING:
        return '❌';
      case TranslationStatus.UNUSED:
        return '🔍';
      default:
        return '❓';
    }
  }

  /**
   * 排序翻译（优先显示常用语言）
   */
  private sortTranslations(translations: Map<string, string>): [string, string][] {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    const priorityLanguages = config.get('hoverPriorityLanguages', ['en', 'zh', 'es', 'fr', 'de', 'ja']);
    
    const entries = Array.from(translations.entries());
    
    return entries.sort(([localeA], [localeB]) => {
      const priorityA = priorityLanguages.indexOf(localeA);
      const priorityB = priorityLanguages.indexOf(localeB);
      
      // 如果都在优先列表中，按优先级排序
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }
      
      // 优先语言排在前面
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;
      
      // 其他语言按字母顺序排序
      return localeA.localeCompare(localeB);
    });
  }

  /**
   * 获取语言区域标志
   */
  private getLocaleFlag(locale: string): string {
    const flagMap: { [key: string]: string } = {
      'en': '🇺🇸',
      'zh': '🇨🇳',
      'zh_CN': '🇨🇳',
      'zh_TW': '🇹🇼',
      'zh_HK': '🇭🇰',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'th': '🇹🇭',
      'vi': '🇻🇳',
      'tr': '🇹🇷',
      'pl': '🇵🇱',
      'nl': '🇳🇱',
      'sv': '🇸🇪',
      'da': '🇩🇰',
      'no': '🇳🇴',
      'fi': '🇫🇮'
    };
    
    return flagMap[locale] || '🌐';
  }

  /**
   * 获取语言名称
   */
  private getLocaleName(locale: string): string {
    const nameMap: { [key: string]: string } = {
      'en': 'English',
      'zh': 'Chinese',
      'zh_CN': 'Chinese (Simplified)',
      'zh_TW': 'Chinese (Traditional)',
      'zh_HK': 'Chinese (Hong Kong)',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish'
    };
    
    return nameMap[locale] || locale.toUpperCase();
  }

  /**
   * 获取缺失的语言区域
   */
  private getMissingLocales(translations: Map<string, string>): string[] {
    const allLocales = Array.from(this.arbManager.getArbFiles().keys());
    const translatedLocales = Array.from(translations.keys());
    
    return allLocales.filter(locale => !translatedLocales.includes(locale));
  }

  /**
   * 获取 ARB 条目
   */
  private getArbEntry(key: string): ArbEntry | undefined {
    // 首先尝试获取英文版本
    const enArbFile = this.arbManager.getArbFile('en');
    if (enArbFile && enArbFile.entries.has(key)) {
      return enArbFile.entries.get(key);
    }
    
    // 如果没有英文版本，尝试获取默认语言版本
    const defaultLocale = this.arbManager.getDefaultLocale();
    const defaultArbFile = this.arbManager.getArbFile(defaultLocale);
    if (defaultArbFile && defaultArbFile.entries.has(key)) {
      return defaultArbFile.entries.get(key);
    }
    
    return undefined;
  }

  /**
   * 转义 Markdown 特殊字符
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\|/g, '\\|');
  }
}

/**
 * 增强的悬停提供器
 * 提供更丰富的悬停信息，如翻译历史、建议等
 */
export class EnhancedI18nHoverProvider extends I18nHoverProvider {
  /**
   * 创建增强的悬停内容
   */
  protected createHoverContent(reference: I18nReference): vscode.MarkdownString | null {
    const baseContent = super.createHoverContent(reference);
    if (!baseContent) {
      return null;
    }

    // 添加额外信息
    this.addTranslationTips(baseContent, reference);
    this.addRelatedKeys(baseContent, reference.key);
    
    return baseContent;
  }

  /**
   * 添加翻译提示
   */
  private addTranslationTips(markdown: vscode.MarkdownString, reference: I18nReference): void {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    if (!config.get('showTranslationTips', true)) {
      return;
    }

    const tips: string[] = [];
    
    // 检查参数使用
    if (reference.parameters && reference.parameters.length > 0) {
      tips.push('💡 This key uses parameters. Make sure all translations include the same placeholders.');
    }
    
    // 检查键名约定
    if (reference.key.includes('_')) {
      tips.push('📝 Consider using camelCase for consistency (e.g., `myKey` instead of `my_key`).');
    }
    
    // 检查长度
    const translations = this.arbManager.getAllTranslations(reference.key);
    const hasLongTranslations = Array.from(translations.values()).some(t => t.length > 100);
    if (hasLongTranslations) {
      tips.push('📏 Some translations are quite long. Consider breaking them into smaller parts.');
    }
    
    if (tips.length > 0) {
      markdown.appendMarkdown('#### Tips:\n\n');
      for (const tip of tips) {
        markdown.appendMarkdown(`${tip}\n\n`);
      }
    }
  }

  /**
   * 添加相关键
   */
  private addRelatedKeys(markdown: vscode.MarkdownString, key: string): void {
    const config = vscode.workspace.getConfiguration('flutter-i18n-vscode-inline');
    if (!config.get('showRelatedKeys', true)) {
      return;
    }

    const relatedKeys = this.findRelatedKeys(key);
    if (relatedKeys.length === 0) {
      return;
    }

    markdown.appendMarkdown('#### Related Keys:\n\n');
    
    for (const relatedKey of relatedKeys.slice(0, 5)) {
      const editCommand = `command:flutter-i18n-vscode-inline.editTranslation?${encodeURIComponent(JSON.stringify([relatedKey]))}`;
      markdown.appendMarkdown(`- [\`${relatedKey}\`](${editCommand})\n`);
    }
    
    if (relatedKeys.length > 5) {
      markdown.appendMarkdown(`\n*... and ${relatedKeys.length - 5} more*\n`);
    }
    
    markdown.appendMarkdown('\n');
  }

  /**
   * 查找相关键
   */
  private findRelatedKeys(key: string): string[] {
    const allKeys = this.arbManager.getAllKeysArray();
    const keyParts = key.split(/[._]/);
    const relatedKeys: string[] = [];
    
    for (const otherKey of allKeys) {
      if (otherKey === key) continue;
      
      // 检查是否有共同前缀
      const otherParts = otherKey.split(/[._]/);
      const commonPrefixLength = this.getCommonPrefixLength(keyParts, otherParts);
      
      if (commonPrefixLength > 0) {
        relatedKeys.push(otherKey);
      }
    }
    
    // 按相似度排序
    return relatedKeys.sort((a, b) => {
      const similarityA = this.calculateSimilarity(key, a);
      const similarityB = this.calculateSimilarity(key, b);
      return similarityB - similarityA;
    });
  }

  /**
   * 获取共同前缀长度
   */
  private getCommonPrefixLength(parts1: string[], parts2: string[]): number {
    let length = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        length++;
      } else {
        break;
      }
    }
    
    return length;
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}