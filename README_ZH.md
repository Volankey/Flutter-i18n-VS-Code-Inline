## 中文版 README (README.zh-CN.md)

```markdown
# Flutter i18n VS Code Inline

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/yourpublisher.flutter-i18n-vscode-inline?style=flat-square&label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=yourpublisher.flutter-i18n-vscode-inline)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/yourpublisher.flutter-i18n-vscode-inline?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yourpublisher.flutter-i18n-vscode-inline)
[![Ratings](https://img.shields.io/visual-studio-marketplace/r/yourpublisher.flutter-i18n-vscode-inline?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yourpublisher.flutter-i18n-vscode-inline)

为你的 Flutter 国际化 (i18n) 和本地化 (l10n) 工作流强势赋能。告别在 `.dart` 代码和 `.arb` 文件之间频繁切换的日子。**现在，直接在你的代码编辑器中预览、编辑和管理所有翻译！**

> 这款 VS Code 插件专为追求极致效率的 Flutter 开发者设计，是优化 i18n 开发体验的最佳实践。

---

## ✨ 核心功能

### 🚀 内联翻译预览与编辑
在你的代码中即时查看翻译，无需切换上下文。一键点击，原地修改任何语言的翻译。这是提升 Flutter 本地化效率的最佳方式。

![功能演示 GIF](https://your-repo-url/demo.gif)

### 主要功能一览:

* 👁️ **内联翻译预览**: 在 Dart 编辑器中，你的 i18n Key 上方会直接以内联注解（CodeLens）的形式显示其翻译文本。
* ✍️ **在 VS Code 中直接编辑**: 点击该注解，即可立即修改此 Key 在任何语言中的翻译，无需离开当前文件。更改会自动保存到对应的 `.arb` 文件中。
* 🌐 **多语言悬停预览**: 将鼠标悬停在一个 i18n Key 上，即可在一个方便的浮窗中看到它在所有支持语言中的翻译。
* ❗ **缺失翻译诊断**: 插件会自动检测并在“问题”面板中报告那些在某些语言文件中缺失的翻译 Key。
* 📁 **完美支持 `.arb` 文件**: 为 Flutter 官方推荐的、基于 `.arb` 文件的国际化方案量身打造。

## 🤔 为什么选择 Flutter i18n VS Code Inline?

传统的 Flutter 国际化开发流程非常繁琐。你需要在 Dart 代码中写一个 Key，然后切换到 `app_en.arb` 文件添加英文翻译，再切换到 `app_zh.arb` 添加中文翻译......这个过程不仅效率低下，还很容易出错。

**Flutter i18n VS Code Inline** 彻底改变了这一工作流。它将整个翻译管理流程带入你的 Dart 编辑器，使其成为一种可视化、无缝衔接的流畅体验。

## 📦 安装

1. 打开 **Visual Studio Code**。
2. 进入 **扩展** 视图 (`Ctrl+Shift+X`)。
3. 搜索 `Flutter i18n VS Code Inline`。
4. 点击 **安装**。

你也可以 [从 VS Code 应用市场安装](https://marketplace.visualstudio.com/items?itemName=yourpublisher.flutter-i18n-vscode-inline)。

## 📖 使用指南

1. **打开一个已配置好国际化** (使用 `.arb` 文件) 的 Flutter 项目。
2. **打开一个使用了 i18n Key 的 Dart 文件** (例如 `S.of(context).myKey`)。
3. **见证奇迹**: Key 的上方会出现一个注解，显示其默认语言的翻译。
4. **如何编辑**: 点击该注解。一个输入框将会出现，允许你修改每种语言的翻译。按 `Enter` 保存。
5. **如何查看所有翻译**: 只需将鼠标悬停在 i18n Key 上。

## ⚙️ 插件配置

(在 VS Code 设置中搜索 "flutter-i18n-vscode-inline" 来配置:)

```json
{
  "flutter-i18n-vscode-inline.enableCodeLens": true,
  "flutter-i18n-vscode-inline.enableHover": true,
  "flutter-i18n-vscode-inline.previewLanguage": "zh-CN",
  "flutter-i18n-vscode-inline.showTranslationStats": false,
  "flutter-i18n-vscode-inline.customPatterns": {},
  "flutter-i18n-vscode-inline.enableCustomPatterns": false,
  "flutter-i18n-vscode-inline.showTranslationPreview": true
}
```

- `enableCodeLens`: 启用 CodeLens 内联翻译预览 (默认: true)
- `enableHover`: 启用悬停提示翻译预览 (默认: true)
- `previewLanguage`: 默认翻译预览语言 (默认: "zh-CN")
- `showTranslationStats`: 在 CodeLens 中显示翻译统计 (默认: false)
- `customPatterns`: 自定义 i18n 检测正则模式 (默认: {})
  示例：
  ```json
  "flutter-i18n-vscode-inline.customPatterns": {
    "generatedClass": "\\bS\\.of\\(\\s*context\\s*\\)\\.(\\w+)"
  }
  ```
- `enableCustomPatterns`: 启用自定义正则模式 (禁用时使用内置模式) (默认: false)
- `showTranslationPreview`: 在悬停内容顶部显示突出翻译预览 (默认: true)

## 🤝 贡献代码

欢迎提交贡献、报告问题和提出功能需求！请访问 问题页面。

标签: Flutter, i18n, 国际化, l10n, 本地化, VS Code 插件, Dart, .arb, 生产力, 开发工具, 内联翻译, 修改翻译
```