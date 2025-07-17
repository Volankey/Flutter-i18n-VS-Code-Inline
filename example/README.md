# Flutter i18n VS Code Inline 示例项目

这个示例项目展示了如何在 Flutter 项目中使用 Flutter i18n VS Code Inline 插件。

## 项目结构

```
example/
├── lib/
│   ├── main.dart                 # 应用入口
│   ├── l10n/
│   │   ├── app_localizations.dart # 生成的本地化类
│   │   └── app_localizations_*.dart
│   ├── screens/
│   │   ├── home_screen.dart      # 主页面
│   │   ├── profile_screen.dart   # 个人资料页面
│   │   └── settings_screen.dart  # 设置页面
│   └── widgets/
│       ├── custom_button.dart    # 自定义按钮
│       └── user_card.dart        # 用户卡片
├── lib/l10n/
│   ├── app_en.arb               # 英文翻译
│   ├── app_zh.arb               # 中文翻译
│   ├── app_ja.arb               # 日文翻译
│   └── app_es.arb               # 西班牙文翻译
├── l10n.yaml                    # 本地化配置
└── pubspec.yaml                 # 项目配置
```

## 配置文件

### pubspec.yaml

```yaml
name: flutter_i18n_example
description: Flutter i18n VS Code Inline 示例项目
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: any

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
  generate: true
```

### l10n.yaml

```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
output-dir: lib/l10n
preferred-supported-locales: ["en"]
```

## ARB 文件示例

### lib/l10n/app_en.arb (英文模板)

```json
{
  "@@locale": "en",
  "appTitle": "Flutter i18n Example",
  "@appTitle": {
    "description": "The title of the application"
  },
  "welcome": "Welcome to Flutter!",
  "@welcome": {
    "description": "Welcome message displayed on the home screen"
  },
  "hello": "Hello",
  "@hello": {
    "description": "A simple greeting"
  },
  "helloUser": "Hello, {name}!",
  "@helloUser": {
    "description": "Greeting with user name",
    "placeholders": {
      "name": {
        "type": "String",
        "description": "The user's name"
      }
    }
  },
  "itemCount": "{count, plural, =0{No items} =1{One item} other{{count} items}}",
  "@itemCount": {
    "description": "Number of items with plural support",
    "placeholders": {
      "count": {
        "type": "int",
        "description": "The number of items"
      }
    }
  },
  "loginButton": "Login",
  "@loginButton": {
    "description": "Text for the login button"
  },
  "logoutButton": "Logout",
  "@logoutButton": {
    "description": "Text for the logout button"
  },
  "profile": "Profile",
  "@profile": {
    "description": "Profile page title"
  },
  "settings": "Settings",
  "@settings": {
    "description": "Settings page title"
  },
  "language": "Language",
  "@language": {
    "description": "Language setting label"
  },
  "theme": "Theme",
  "@theme": {
    "description": "Theme setting label"
  },
  "darkMode": "Dark Mode",
  "@darkMode": {
    "description": "Dark mode setting label"
  },
  "save": "Save",
  "@save": {
    "description": "Save button text"
  },
  "cancel": "Cancel",
  "@cancel": {
    "description": "Cancel button text"
  },
  "email": "Email",
  "@email": {
    "description": "Email field label"
  },
  "password": "Password",
  "@password": {
    "description": "Password field label"
  },
  "confirmPassword": "Confirm Password",
  "@confirmPassword": {
    "description": "Confirm password field label"
  },
  "invalidEmail": "Please enter a valid email address",
  "@invalidEmail": {
    "description": "Error message for invalid email"
  },
  "passwordTooShort": "Password must be at least {minLength} characters",
  "@passwordTooShort": {
    "description": "Error message for short password",
    "placeholders": {
      "minLength": {
        "type": "int",
        "description": "Minimum password length"
      }
    }
  },
  "passwordMismatch": "Passwords do not match",
  "@passwordMismatch": {
    "description": "Error message when passwords don't match"
  }
}
```

### lib/l10n/app_zh.arb (中文翻译)

```json
{
  "@@locale": "zh",
  "appTitle": "Flutter 国际化示例",
  "welcome": "欢迎使用 Flutter！",
  "hello": "你好",
  "helloUser": "你好，{name}！",
  "itemCount": "{count, plural, =0{没有项目} =1{一个项目} other{{count} 个项目}}",
  "loginButton": "登录",
  "logoutButton": "退出登录",
  "profile": "个人资料",
  "settings": "设置",
  "language": "语言",
  "theme": "主题",
  "darkMode": "深色模式",
  "save": "保存",
  "cancel": "取消",
  "email": "邮箱",
  "password": "密码",
  "confirmPassword": "确认密码",
  "invalidEmail": "请输入有效的邮箱地址",
  "passwordTooShort": "密码长度至少为 {minLength} 个字符",
  "passwordMismatch": "密码不匹配"
}
```

## Dart 代码示例

### lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // 插件会在这里显示翻译预览
      title: AppLocalizations.of(context)?.appTitle ?? 'Flutter i18n Example',
      
      // 本地化配置
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'), // English
        Locale('zh'), // Chinese
        Locale('ja'), // Japanese
        Locale('es'), // Spanish
      ],
      
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
```

### lib/screens/home_screen.dart

```dart
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../widgets/custom_button.dart';
import '../widgets/user_card.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _itemCount = 0;
  final String _userName = 'John Doe';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        // 插件会显示翻译预览："Flutter 国际化示例"
        title: Text(l10n.appTitle),
        actions: [
          IconButton(
            onPressed: () => _navigateToSettings(context),
            icon: const Icon(Icons.settings),
            // 插件会显示翻译预览："设置"
            tooltip: l10n.settings,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 欢迎消息
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // 插件会显示翻译预览："欢迎使用 Flutter！"
                    Text(
                      l10n.welcome,
                      style: Theme.of(context).textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    // 插件会显示翻译预览："你好，John Doe！"
                    Text(
                      l10n.helloUser(_userName),
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // 用户卡片
            UserCard(
              name: _userName,
              email: 'john.doe@example.com',
              onTap: () => _navigateToProfile(context),
            ),
            
            const SizedBox(height: 20),
            
            // 项目计数器
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // 插件会显示翻译预览："没有项目" / "一个项目" / "5 个项目"
                    Text(
                      l10n.itemCount(_itemCount),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton(
                          onPressed: () => setState(() => _itemCount++),
                          child: const Text('+1'),
                        ),
                        ElevatedButton(
                          onPressed: _itemCount > 0 
                              ? () => setState(() => _itemCount--)
                              : null,
                          child: const Text('-1'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // 自定义按钮示例
            CustomButton(
              // 插件会显示翻译预览："登录"
              text: l10n.loginButton,
              onPressed: () => _showLoginDialog(context),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToProfile(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ProfileScreen()),
    );
  }

  void _navigateToSettings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SettingsScreen()),
    );
  }

  void _showLoginDialog(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.loginButton),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                // 插件会显示翻译预览："邮箱"
                labelText: l10n.email,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                // 插件会显示翻译预览："密码"
                labelText: l10n.password,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            // 插件会显示翻译预览："取消"
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            // 插件会显示翻译预览："登录"
            child: Text(l10n.loginButton),
          ),
        ],
      ),
    );
  }
}
```

### lib/widgets/custom_button.dart

```dart
import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? textColor;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.backgroundColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? Theme.of(context).primaryColor,
          foregroundColor: textColor ?? Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
```

### lib/widgets/user_card.dart

```dart
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

class UserCard extends StatelessWidget {
  final String name;
  final String email;
  final VoidCallback? onTap;

  const UserCard({
    super.key,
    required this.name,
    required this.email,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Theme.of(context).primaryColor,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
```

## 插件功能演示

### 1. 内联翻译预览 (CodeLens)

当你在 Dart 代码中使用 `l10n.welcome` 时，插件会在代码上方显示：

```dart
// 🌐 "欢迎使用 Flutter！" (zh) | "Welcome to Flutter!" (en)
Text(l10n.welcome)
```

### 2. 悬停翻译信息 (Hover)

鼠标悬停在 `l10n.helloUser(_userName)` 上时，会显示：

```
🌐 Translation: helloUser

✅ en: Hello, {name}!
✅ zh: 你好，{name}！
❌ ja: Missing
❌ es: Missing

📊 Translation Status: 2/4 languages (50%)

🔧 Actions:
• Edit Translation
• Copy Key Name
• Find Usage
```

### 3. 智能诊断 (Diagnostics)

如果你使用了不存在的翻译键：

```dart
Text(l10n.nonExistentKey) // ❌ Missing translation key 'nonExistentKey'
```

插件会显示错误诊断，并提供快速修复选项：
- 创建缺失的翻译键
- 替换为相似的现有键
- 移除无效引用

### 4. 快速编辑

右键点击翻译键，选择 "Edit Translation" 可以快速编辑所有语言的翻译：

```
┌─ Edit Translation: welcome ─────────────────┐
│ English (en): Welcome to Flutter!          │
│ Chinese (zh): 欢迎使用 Flutter！            │
│ Japanese (ja): [Empty - Add translation]   │
│ Spanish (es): [Empty - Add translation]    │
│                                            │
│ [Save] [Cancel]                            │
└────────────────────────────────────────────┘
```

## 使用技巧

### 1. 配置插件

在 VS Code 设置中搜索 "flutter-i18n" 来配置插件：

```json
{
  "flutter-i18n-vscode-inline.inlinePreview.enabled": true,
  "flutter-i18n-vscode-inline.inlinePreview.languages": ["en", "zh"],
  "flutter-i18n-vscode-inline.hoverPreview.showAllLanguages": true,
  "flutter-i18n-vscode-inline.diagnostics.enabled": true
}
```

### 2. 键盘快捷键

- `Ctrl+Shift+P` → "Flutter i18n: Edit Translation" - 编辑当前翻译
- `Ctrl+Shift+P` → "Flutter i18n: Create Key" - 创建新翻译键
- `Ctrl+Shift+P` → "Flutter i18n: Show Statistics" - 显示翻译统计

### 3. 最佳实践

1. **使用描述性键名**：`loginButton` 而不是 `btn1`
2. **添加描述和占位符**：在 ARB 文件中添加 `@` 元数据
3. **保持翻译同步**：定期检查缺失的翻译
4. **使用复数形式**：对于数量相关的文本使用 `{count, plural, ...}`

## 故障排除

### 常见问题

1. **插件不工作**
   - 确认项目包含 `flutter_localizations` 依赖
   - 检查 `l10n.yaml` 配置文件
   - 重启 VS Code

2. **翻译不显示**
   - 确认 ARB 文件格式正确
   - 检查文件路径配置
   - 查看 VS Code 输出面板的错误信息

3. **CodeLens 不显示**
   - 确认在插件设置中启用了内联预览
   - 检查文档语言是否为 'dart'
   - 确认代码中包含有效的 i18n 引用

### 调试步骤

1. 打开 VS Code 开发者工具 (Help → Toggle Developer Tools)
2. 查看控制台错误信息
3. 检查插件输出面板
4. 重新加载窗口 (Ctrl+Shift+P → "Developer: Reload Window")

这个示例项目展示了插件的所有主要功能，帮助开发者快速理解和使用 Flutter i18n VS Code Inline 插件。