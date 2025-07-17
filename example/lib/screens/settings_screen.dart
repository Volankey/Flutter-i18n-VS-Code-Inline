import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../widgets/custom_button.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _selectedLanguage = 'en';
  bool _isDarkMode = false;
  bool _notificationsEnabled = true;
  bool _soundEnabled = true;
  double _fontSize = 16.0;

  final Map<String, String> _languageNames = {
    'en': 'English',
    'zh': '中文',
    'ja': '日本語',
    'es': 'Español',
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        // 插件会显示翻译预览："设置"
        title: Text(l10n.settings),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // 语言设置
          _buildLanguageSection(l10n),
          
          const SizedBox(height: 24),
          
          // 外观设置
          _buildAppearanceSection(l10n),
          
          const SizedBox(height: 24),
          
          // 通知设置
          _buildNotificationSection(l10n),
          
          const SizedBox(height: 24),
          
          // 辅助功能设置
          _buildAccessibilitySection(l10n),
          
          const SizedBox(height: 24),
          
          // 关于设置
          _buildAboutSection(l10n),
          
          const SizedBox(height: 32),
          
          // 重置按钮
          _buildResetSection(l10n),
        ],
      ),
    );
  }

  Widget _buildLanguageSection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："语言"
              l10n.language,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedLanguage,
              decoration: InputDecoration(
                // 插件会显示翻译预览："选择语言"
                labelText: l10n.selectLanguage,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.language),
              ),
              items: _languageNames.entries.map((entry) {
                return DropdownMenuItem<String>(
                  value: entry.key,
                  child: Text(entry.value),
                );
              }).toList(),
              onChanged: (String? newValue) {
                if (newValue != null) {
                  setState(() => _selectedLanguage = newValue);
                  _showLanguageChangeDialog(l10n);
                }
              },
            ),
            const SizedBox(height: 12),
            Text(
              // 插件会显示翻译预览："重启应用后生效"
              l10n.restartToApply,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppearanceSection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："外观"
              l10n.appearance,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              // 插件会显示翻译预览："深色模式"
              title: Text(l10n.darkMode),
              subtitle: Text(
                _isDarkMode 
                    // 插件会显示翻译预览："使用深色主题"
                    ? l10n.useDarkTheme 
                    // 插件会显示翻译预览："使用浅色主题"
                    : l10n.useLightTheme,
              ),
              value: _isDarkMode,
              onChanged: (bool value) {
                setState(() => _isDarkMode = value);
              },
              secondary: Icon(
                _isDarkMode ? Icons.dark_mode : Icons.light_mode,
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.palette),
              // 插件会显示翻译预览："主题颜色"
              title: Text(l10n.themeColor),
              // 插件会显示翻译预览："自定义应用主题颜色"
              subtitle: Text(l10n.customizeThemeColor),
              trailing: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor,
                  shape: BoxShape.circle,
                ),
              ),
              onTap: () => _showThemeColorPicker(l10n),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationSection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："通知"
              l10n.notifications,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              // 插件会显示翻译预览："启用通知"
              title: Text(l10n.enableNotifications),
              subtitle: Text(
                _notificationsEnabled 
                    // 插件会显示翻译预览："接收应用通知"
                    ? l10n.receiveAppNotifications 
                    // 插件会显示翻译预览："通知已禁用"
                    : l10n.notificationsDisabled,
              ),
              value: _notificationsEnabled,
              onChanged: (bool value) {
                setState(() => _notificationsEnabled = value);
              },
              secondary: Icon(
                _notificationsEnabled 
                    ? Icons.notifications 
                    : Icons.notifications_off,
              ),
            ),
            const Divider(),
            SwitchListTile(
              // 插件会显示翻译预览："声音"
              title: Text(l10n.sound),
              subtitle: Text(
                _soundEnabled 
                    // 插件会显示翻译预览："播放通知声音"
                    ? l10n.playNotificationSound 
                    // 插件会显示翻译预览："静音模式"
                    : l10n.silentMode,
              ),
              value: _soundEnabled,
              onChanged: _notificationsEnabled 
                  ? (bool value) => setState(() => _soundEnabled = value)
                  : null,
              secondary: Icon(
                _soundEnabled ? Icons.volume_up : Icons.volume_off,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccessibilitySection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："辅助功能"
              l10n.accessibility,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.text_fields),
              // 插件会显示翻译预览："字体大小"
              title: Text(l10n.fontSize),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    // 插件会显示翻译预览："调整文本大小以提高可读性"
                    l10n.adjustTextSizeForReadability,
                  ),
                  const SizedBox(height: 8),
                  Slider(
                    value: _fontSize,
                    min: 12.0,
                    max: 24.0,
                    divisions: 6,
                    label: '${_fontSize.round()}px',
                    onChanged: (double value) {
                      setState(() => _fontSize = value);
                    },
                  ),
                  Text(
                    // 插件会显示翻译预览："预览文本"
                    '${l10n.previewText}: ${l10n.sampleText}',
                    style: TextStyle(fontSize: _fontSize),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAboutSection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："关于"
              l10n.about,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.info),
              // 插件会显示翻译预览："应用版本"
              title: Text(l10n.appVersion),
              subtitle: const Text('1.0.0+1'),
              onTap: () => _showVersionInfo(l10n),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.help),
              // 插件会显示翻译预览："帮助与支持"
              title: Text(l10n.helpAndSupport),
              // 插件会显示翻译预览："获取帮助或联系支持"
              subtitle: Text(l10n.getHelpOrContactSupport),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _showHelpDialog(l10n),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.privacy_tip),
              // 插件会显示翻译预览："隐私政策"
              title: Text(l10n.privacyPolicy),
              // 插件会显示翻译预览："查看我们的隐私政策"
              subtitle: Text(l10n.viewOurPrivacyPolicy),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _showPrivacyPolicy(l10n),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResetSection(AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              // 插件会显示翻译预览："重置"
              l10n.reset,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            CustomButton(
              // 插件会显示翻译预览："重置所有设置"
              text: l10n.resetAllSettings,
              onPressed: () => _showResetConfirmation(l10n),
              backgroundColor: Colors.red,
              icon: Icons.restore,
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguageChangeDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        // 插件会显示翻译预览："语言已更改"
        title: Text(l10n.languageChanged),
        content: Text(
          // 插件会显示翻译预览："语言设置已更新。请重启应用以应用更改。"
          l10n.languageChangeMessage,
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

  void _showThemeColorPicker(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.themeColor),
        content: Text(
          // 插件会显示翻译预览："主题颜色选择器即将推出！"
          l10n.themeColorPickerComingSoon,
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

  void _showVersionInfo(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.appVersion),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${l10n.version}: 1.0.0+1'),
            Text('${l10n.buildNumber}: 1'),
            Text('${l10n.releaseDate}: 2024-01-01'),
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

  void _showHelpDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.helpAndSupport),
        content: Text(
          // 插件会显示翻译预览："如需帮助，请发送邮件至 support@example.com"
          l10n.helpContactMessage,
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

  void _showPrivacyPolicy(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.privacyPolicy),
        content: SingleChildScrollView(
          child: Text(
            // 插件会显示翻译预览："我们重视您的隐私..."
            l10n.privacyPolicyContent,
          ),
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

  void _showResetConfirmation(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        // 插件会显示翻译预览："确认重置"
        title: Text(l10n.confirmReset),
        content: Text(
          // 插件会显示翻译预览："这将重置所有设置到默认值。此操作无法撤销。"
          l10n.resetConfirmationMessage,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _resetAllSettings(l10n);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: Text(l10n.reset),
          ),
        ],
      ),
    );
  }

  void _resetAllSettings(AppLocalizations l10n) {
    setState(() {
      _selectedLanguage = 'en';
      _isDarkMode = false;
      _notificationsEnabled = true;
      _soundEnabled = true;
      _fontSize = 16.0;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        // 插件会显示翻译预览："设置已重置"
        content: Text(l10n.settingsReset),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}