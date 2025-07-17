// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'Flutter 国际化示例';

  @override
  String get welcome => '欢迎使用 Flutter！';

  @override
  String get hello => '你好';

  @override
  String helloUser(String name) {
    return '你好，$name！';
  }

  @override
  String itemCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count 个项目',
      one: '一个项目',
      zero: '没有项目',
    );
    return '$_temp0';
  }

  @override
  String get loginButton => '登录';

  @override
  String get logoutButton => '退出登录';

  @override
  String get profile => '个人资料';

  @override
  String get settings => '设置';

  @override
  String get language => '语言';

  @override
  String get theme => '主题';

  @override
  String get darkMode => '深色模式';

  @override
  String get save => '保存';

  @override
  String get cancel => '取消';

  @override
  String get close => '关闭';

  @override
  String get email => '邮箱';

  @override
  String get password => '密码';

  @override
  String get confirmPassword => '确认密码';

  @override
  String get invalidEmail => '请输入有效的邮箱地址';

  @override
  String passwordTooShort(int minLength) {
    return '密码长度至少为 $minLength 个字符';
  }

  @override
  String get passwordMismatch => '密码不匹配';

  @override
  String get loginSuccess => '登录成功！';

  @override
  String get translationInfo => '翻译信息';

  @override
  String get partialTranslationWarning => '此功能的翻译不完整。某些语言可能显示备用文本。';

  @override
  String get translationStatus => '翻译状态：';

  @override
  String get englishTranslation => '英语';

  @override
  String get chineseTranslation => '中文';

  @override
  String get japaneseTranslation => '日语';

  @override
  String get spanishTranslation => '西班牙语';

  @override
  String get partiallyTranslatedKey => '部分翻译功能';

  @override
  String get firstName => '名字';

  @override
  String get lastName => '姓氏';

  @override
  String get phoneNumber => '电话号码';

  @override
  String get address => '地址';

  @override
  String get city => '城市';

  @override
  String get country => '国家';

  @override
  String get edit => '编辑';

  @override
  String get delete => '删除';

  @override
  String get confirm => '确认';

  @override
  String get loading => '加载中...';

  @override
  String get error => '错误';

  @override
  String get success => '成功';

  @override
  String get retry => '重试';

  @override
  String get refresh => '刷新';

  @override
  String get refreshData => 'Refresh Data';

  @override
  String get personalInfo => 'Personal Information';

  @override
  String get pleaseEnterFirstName => 'Please enter your first name';

  @override
  String get pleaseEnterLastName => 'Please enter your last name';

  @override
  String get contactInfo => 'Contact Information';

  @override
  String get addressInfo => 'Address Information';

  @override
  String get profileSaved => 'Profile saved successfully!';

  @override
  String get editUserInfo => 'Edit user information';

  @override
  String get selectLanguage => '选择语言';

  @override
  String get restartToApply => '重启应用后生效';

  @override
  String get appearance => '外观';

  @override
  String get useDarkTheme => '使用深色主题';

  @override
  String get useLightTheme => '使用浅色主题';

  @override
  String get themeColor => '主题颜色';

  @override
  String get customizeThemeColor => '自定义应用主题颜色';

  @override
  String get notifications => '通知';

  @override
  String get enableNotifications => '启用通知';

  @override
  String get receiveAppNotifications => '接收应用通知';

  @override
  String get notificationsDisabled => '通知已禁用';

  @override
  String get sound => '声音';

  @override
  String get playNotificationSound => '播放通知声音';

  @override
  String get silentMode => '静音模式';

  @override
  String get accessibility => '辅助功能';

  @override
  String get fontSize => '字体大小';

  @override
  String get adjustTextSizeForReadability => '调整文本大小以提高可读性';

  @override
  String get previewText => '预览文本';

  @override
  String get sampleText => '这是示例文本';

  @override
  String get about => '关于';

  @override
  String get appVersion => '应用版本';

  @override
  String get helpAndSupport => '帮助与支持';

  @override
  String get getHelpOrContactSupport => '获取帮助或联系支持';

  @override
  String get privacyPolicy => '隐私政策';

  @override
  String get viewOurPrivacyPolicy => '查看我们的隐私政策';

  @override
  String get reset => '重置';

  @override
  String get resetAllSettings => '重置所有设置';

  @override
  String get languageChanged => '语言已更改';

  @override
  String get languageChangeMessage => '语言设置已更新。请重启应用以应用更改。';

  @override
  String get themeColorPickerComingSoon => '主题颜色选择器即将推出！';

  @override
  String get version => '版本';

  @override
  String get buildNumber => '构建号';

  @override
  String get releaseDate => '发布日期';

  @override
  String get helpContactMessage => '如需帮助，请发送邮件至 support@example.com';

  @override
  String get privacyPolicyContent =>
      '我们重视您的隐私，致力于保护您的个人信息。本应用仅收集功能所需的最少数据，未经您同意不会与第三方共享您的信息。';

  @override
  String get confirmReset => '确认重置';

  @override
  String get resetConfirmationMessage => '这将重置所有设置到默认值。此操作无法撤销。';

  @override
  String get settingsReset => '设置已重置';
}
