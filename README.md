# 🚀 Flutter i18n Inline Editor - Translation Preview & Management

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/volankey.flutter-i18n-vscode-inline?style=flat-square&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/volankey.flutter-i18n-vscode-inline?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline)
[![Ratings](https://img.shields.io/visual-studio-marketplace/r/volankey.flutter-i18n-vscode-inline?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/volankey.flutter-i18n-vscode-inline?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline)
[![License](https://img.shields.io/github/license/volankey/flutter-i18n-vscode-inline?style=flat-square)](LICENSE)

**The ultimate VS Code extension for Flutter developers working with internationalization (i18n) and localization (l10n).** Transform your translation workflow with inline previews, direct editing, and smart diagnostics - all without leaving your Dart code!

> 🎯 **Perfect for Flutter teams** building multilingual apps with `.arb` files and Flutter's official i18n solution.

## 🌟 Why Choose This Extension?

**Before:** Switch between `.dart` → `app_en.arb` → `app_zh.arb` → back to `.dart` 😫  
**After:** Edit all translations directly in your Dart code with visual previews! 🎉

### 💡 **Boost Your Productivity by 3x**
- ⚡ **Zero Context Switching** - Stay in your Dart files
- 👀 **Visual Translation Preview** - See translations as you code
- ✏️ **One-Click Editing** - Modify any language instantly
- 🔍 **Smart Detection** - Automatic missing translation alerts
- 🚀 **Team Collaboration** - Consistent workflow for all developers

---

## ✨ Core Features

### 🚀 Inline Translation Preview and Editing
Instantly view translations in your code without context switching. Click to edit any language's translation in place. This is the best way to boost Flutter localization efficiency.

![Feature Demo GIF](https://raw.githubusercontent.com/Volankey/Flutter-i18n-VS-Code-Inline/refs/heads/main/example.gif)

### Key Features:

* 👁️ **Inline Translation Preview**: In the Dart editor, your i18n key will display its translation text directly above via CodeLens.
* ✍️ **Direct Editing in VS Code**: Click the CodeLens to immediately modify the key's translation in any language without leaving the file. Changes auto-save to corresponding `.arb` files.
* 🌐 **Multi-language Hover Preview**: Hover over an i18n key to see its translations in all supported languages in a convenient popup.
* ❗ **Missing Translation Diagnostics**: The extension automatically detects and reports missing translation keys in certain language files in the Problems panel.
* 📁 **Perfect Support for `.arb` Files**: Tailored for Flutter's officially recommended `.arb`-based internationalization solution.

## 🤔 Why Choose Flutter i18n VS Code Inline?

Traditional Flutter internationalization workflows are cumbersome. You write a key in Dart code, then switch to `app_en.arb` for English, then to `app_zh.arb` for Chinese... This process is inefficient and error-prone.

**Flutter i18n VS Code Inline** revolutionizes this workflow. It brings the entire translation management process into your Dart editor, making it a visual, seamless experience.

## 📦 Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X`).
3. Search for `Flutter i18n VS Code Inline`.
4. Click **Install**.

You can also [install from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline).

## 📖 Usage Guide

1. **Open a Flutter project configured with internationalization** (using `.arb` files).
2. **Open a Dart file using i18n keys** (e.g., `S.of(context).myKey`).
3. **Witness the magic**: A CodeLens appears above the key, showing the default language translation.
4. **How to Edit**: Click the CodeLens. An input box appears, allowing you to modify translations for each language. Press `Enter` to save.
5. **View All Translations**: Simply hover over the i18n key.

## ⚙️ Extension Configuration

(Search for "flutter-i18n-vscode-inline" in VS Code settings to configure:)

```json
{
  "flutter-i18n-vscode-inline.enableCodeLens": true,
  "flutter-i18n-vscode-inline.enableHover": true,
  "flutter-i18n-vscode-inline.previewLanguage": "en",
  "flutter-i18n-vscode-inline.showTranslationStats": false,
  "flutter-i18n-vscode-inline.customPatterns": {},
  "flutter-i18n-vscode-inline.enableCustomPatterns": false,
  "flutter-i18n-vscode-inline.showTranslationPreview": true
}
```

- `enableCodeLens`: Enable CodeLens for inline translation preview (default: true)
- `enableHover`: Enable hover tooltips for translation preview (default: true)
- `previewLanguage`: Default language for translation preview (default: "en")
- `showTranslationStats`: Show translation statistics in CodeLens (default: false)
- `customPatterns`: Custom regex patterns for i18n detection (default: {})
  Example:
  ```json
  "flutter-i18n-vscode-inline.customPatterns": {
    "generatedClass": "\\bS\\.of\\(\\s*context\\s*\\)\\.(\\w+)"
  }
  ```
- `enableCustomPatterns`: Enable custom regex patterns (when disabled, uses built-in patterns) (default: false)
- `showTranslationPreview`: Show highlighted translation preview at the top of hover content (default: true)

## 🤝 Contributing

We welcome contributions, bug reports, and feature requests! Please visit our [GitHub Issues](https://github.com/Volankey/Flutter-i18n-VS-Code-Inline/issues) page.

### 🔗 Useful Links
- [📖 Documentation](https://github.com/Volankey/Flutter-i18n-VS-Code-Inline#readme)
- [🐛 Report Issues](https://github.com/Volankey/Flutter-i18n-VS-Code-Inline/issues)
- [💡 Feature Requests](https://github.com/Volankey/Flutter-i18n-VS-Code-Inline/issues/new)
- [⭐ Rate on Marketplace](https://marketplace.visualstudio.com/items?itemName=volankey.flutter-i18n-vscode-inline&ssr=false#review-details)

---

## 🏷️ Keywords & Tags

**Flutter Development:** `flutter` `dart` `mobile-development` `cross-platform` `app-development`  
**Internationalization:** `i18n` `l10n` `internationalization` `localization` `translation` `multilingual` `locale` `language`  
**VS Code:** `vscode-extension` `editor` `productivity` `developer-tools` `coding` `ide`  
**Features:** `inline-preview` `codelens` `hover` `diagnostics` `arb-files` `workflow` `automation`  
**Use Cases:** `flutter-i18n` `translation-management` `localization-workflow` `developer-productivity` `team-collaboration`

**Perfect for:** Flutter developers, mobile app teams, internationalization specialists, localization managers, and anyone working with multilingual Flutter applications.

---

*Made with ❤️ for the Flutter community. Star ⭐ this project if it helps you build amazing multilingual apps!*
