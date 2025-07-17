// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'Flutter 国際化サンプル';

  @override
  String get welcome => 'Flutterへようこそ！';

  @override
  String get hello => 'こんにちは';

  @override
  String helloUser(String name) {
    return 'こんにちは、$nameさん！';
  }

  @override
  String itemCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count個のアイテム',
      one: '1つのアイテム',
      zero: 'アイテムなし',
    );
    return '$_temp0';
  }

  @override
  String get loginButton => 'ログイン';

  @override
  String get logoutButton => 'ログアウト';

  @override
  String get profile => 'プロフィール';

  @override
  String get settings => '設定';

  @override
  String get language => '言語';

  @override
  String get theme => 'テーマ';

  @override
  String get darkMode => 'ダークモード';

  @override
  String get save => '保存';

  @override
  String get cancel => 'キャンセル';

  @override
  String get close => '閉じる';

  @override
  String get email => 'メールアドレス';

  @override
  String get password => 'パスワード';

  @override
  String get confirmPassword => 'パスワード確認';

  @override
  String get invalidEmail => '有効なメールアドレスを入力してください';

  @override
  String passwordTooShort(int minLength) {
    return 'パスワードは最低$minLength文字必要です';
  }

  @override
  String get passwordMismatch => 'パスワードが一致しません';

  @override
  String get loginSuccess => 'ログイン成功！';

  @override
  String get translationInfo => '翻訳情報';

  @override
  String get partialTranslationWarning =>
      'この機能は部分的な翻訳です。一部の言語では代替テキストが表示される場合があります。';

  @override
  String get translationStatus => '翻訳状況：';

  @override
  String get englishTranslation => '英語';

  @override
  String get chineseTranslation => '中国語';

  @override
  String get japaneseTranslation => '日本語';

  @override
  String get spanishTranslation => 'スペイン語';

  @override
  String get partiallyTranslatedKey => 'Partially Translated Feature';

  @override
  String get firstName => '名前';

  @override
  String get lastName => '姓';

  @override
  String get phoneNumber => '電話番号';

  @override
  String get address => '住所';

  @override
  String get city => '都市';

  @override
  String get country => '国';

  @override
  String get edit => '編集';

  @override
  String get delete => '削除';

  @override
  String get confirm => '確認';

  @override
  String get loading => '読み込み中...';

  @override
  String get error => 'エラー';

  @override
  String get success => '成功';

  @override
  String get retry => '再試行';

  @override
  String get refresh => '更新';

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
  String get selectLanguage => 'Select Language';

  @override
  String get restartToApply => 'Restart app to apply changes';

  @override
  String get appearance => 'Appearance';

  @override
  String get useDarkTheme => 'Use dark theme';

  @override
  String get useLightTheme => 'Use light theme';

  @override
  String get themeColor => 'Theme Color';

  @override
  String get customizeThemeColor => 'Customize app theme color';

  @override
  String get notifications => 'Notifications';

  @override
  String get enableNotifications => 'Enable Notifications';

  @override
  String get receiveAppNotifications => 'Receive app notifications';

  @override
  String get notificationsDisabled => 'Notifications disabled';

  @override
  String get sound => 'Sound';

  @override
  String get playNotificationSound => 'Play notification sound';

  @override
  String get silentMode => 'Silent mode';

  @override
  String get accessibility => 'Accessibility';

  @override
  String get fontSize => 'Font Size';

  @override
  String get adjustTextSizeForReadability =>
      'Adjust text size for better readability';

  @override
  String get previewText => 'Preview';

  @override
  String get sampleText => 'This is sample text';

  @override
  String get about => 'About';

  @override
  String get appVersion => 'App Version';

  @override
  String get helpAndSupport => 'Help & Support';

  @override
  String get getHelpOrContactSupport => 'Get help or contact support';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get viewOurPrivacyPolicy => 'View our privacy policy';

  @override
  String get reset => 'Reset';

  @override
  String get resetAllSettings => 'Reset All Settings';

  @override
  String get languageChanged => 'Language Changed';

  @override
  String get languageChangeMessage =>
      'Language settings have been updated. Please restart the app to apply changes.';

  @override
  String get themeColorPickerComingSoon => 'Theme color picker coming soon!';

  @override
  String get version => 'Version';

  @override
  String get buildNumber => 'Build Number';

  @override
  String get releaseDate => 'Release Date';

  @override
  String get helpContactMessage =>
      'For help, please email us at support@example.com';

  @override
  String get privacyPolicyContent =>
      'We value your privacy and are committed to protecting your personal information. This app collects minimal data necessary for functionality and does not share your information with third parties without your consent.';

  @override
  String get confirmReset => 'Confirm Reset';

  @override
  String get resetConfirmationMessage =>
      'This will reset all settings to their default values. This action cannot be undone.';

  @override
  String get settingsReset => 'Settings have been reset';
}
