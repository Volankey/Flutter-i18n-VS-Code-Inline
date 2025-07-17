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
            
            const SizedBox(height: 16),
            
            // 演示错误情况：使用不存在的翻译键
            // 插件会显示诊断错误：Missing translation key 'nonExistentKey'
            // Text(l10n.nonExistentKey),
            
            // 演示部分翻译的情况
            CustomButton(
              // 这个键在某些语言中可能缺失翻译
              text: l10n.partiallyTranslatedKey,
              onPressed: () => _showPartialTranslationInfo(context),
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
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.loginButton),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                // 插件会显示翻译预览："邮箱"
                labelText: l10n.email,
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: InputDecoration(
                // 插件会显示翻译预览："密码"
                labelText: l10n.password,
                border: const OutlineInputBorder(),
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
            onPressed: () {
              // 简单的验证示例
              final email = emailController.text;
              final password = passwordController.text;
              
              if (email.isEmpty || !email.contains('@')) {
                _showErrorSnackBar(context, l10n.invalidEmail);
                return;
              }
              
              if (password.length < 6) {
                _showErrorSnackBar(context, l10n.passwordTooShort(6));
                return;
              }
              
              Navigator.pop(context);
              _showSuccessSnackBar(context, l10n.loginSuccess);
            },
            // 插件会显示翻译预览："登录"
            child: Text(l10n.loginButton),
          ),
        ],
      ),
    );
  }

  void _showPartialTranslationInfo(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translationInfo),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.partialTranslationWarning),
            const SizedBox(height: 16),
            Text(
              l10n.translationStatus,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('• ${l10n.englishTranslation}: ✅'),
            Text('• ${l10n.chineseTranslation}: ✅'),
            Text('• ${l10n.japaneseTranslation}: ❌'),
            Text('• ${l10n.spanishTranslation}: ❌'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.close),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}