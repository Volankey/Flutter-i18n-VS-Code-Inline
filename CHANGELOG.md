# Change Log

All notable changes to the "Flutter i18n VS Code Inline" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-07-18

### Added
- 🚀 **Inline Translation Preview**: View translations directly in your Dart code via CodeLens
- ✍️ **Direct Editing**: Click CodeLens to edit translations without leaving your code
- 🌐 **Multi-language Hover Preview**: Hover to see translations in all supported languages
- ❗ **Missing Translation Diagnostics**: Automatic detection of missing translation keys
- 📁 **Perfect .arb File Support**: Tailored for Flutter's official internationalization solution
- ⚙️ **Flexible Configuration**: Customize patterns, preview languages, and behavior
- 🎯 **Smart Detection**: Supports multiple i18n patterns (S.of(context), context.l10n, AppLocalizations)
- 📊 **Translation Statistics**: Optional display of translation completion stats
- 🔧 **Custom Patterns**: Define your own regex patterns for i18n detection
- 🚀 **Performance Optimized**: Efficient caching and lazy loading for large projects

### Features
- Support for Flutter's generated localization classes
- Real-time .arb file synchronization
- Configurable CodeLens and hover providers
- Diagnostic reporting for translation issues
- Multi-workspace support
- Extensible pattern matching system

### Technical
- Built with TypeScript for type safety
- Comprehensive test suite
- Modern VS Code extension architecture
- Efficient file watching and caching
- Robust error handling and logging