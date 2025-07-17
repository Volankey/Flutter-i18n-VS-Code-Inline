// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Flutter i18n Example';

  @override
  String get welcome => 'Welcome to Flutter!';

  @override
  String get hello => 'Hello';

  @override
  String helloUser(String name) {
    return 'Hello, $name!';
  }

  @override
  String itemCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count items',
      one: 'One item',
      zero: 'No items',
    );
    return '$_temp0';
  }

  @override
  String get loginButton => 'Login';

  @override
  String get logoutButton => 'Logout';

  @override
  String get profile => 'Profile';

  @override
  String get settings => 'Settings';

  @override
  String get language => 'Language';

  @override
  String get theme => 'Theme';

  @override
  String get darkMode => 'Dark Mode';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get close => 'Close';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get confirmPassword => 'Confirm Password';

  @override
  String get invalidEmail => 'Please enter a valid email address';

  @override
  String passwordTooShort(int minLength) {
    return 'Password must be at least $minLength characters';
  }

  @override
  String get passwordMismatch => 'Passwords do not match';

  @override
  String get loginSuccess => 'Login successful!';

  @override
  String get translationInfo => 'Translation Information';

  @override
  String get partialTranslationWarning =>
      'This feature has partial translations. Some languages may show fallback text.';

  @override
  String get translationStatus => 'Translation Status:';

  @override
  String get englishTranslation => 'English';

  @override
  String get chineseTranslation => 'Chinese';

  @override
  String get japaneseTranslation => 'Japanese';

  @override
  String get spanishTranslation => 'Spanish';

  @override
  String get partiallyTranslatedKey => 'Partially Translated Feature';

  @override
  String get firstName => 'First Name';

  @override
  String get lastName => 'Last Name';

  @override
  String get phoneNumber => 'Phone Number';

  @override
  String get address => 'Address';

  @override
  String get city => 'City';

  @override
  String get country => 'Country';

  @override
  String get edit => 'Edit';

  @override
  String get delete => 'Delete';

  @override
  String get confirm => 'Confirm';

  @override
  String get loading => 'Loading...';

  @override
  String get error => 'Error';

  @override
  String get success => 'Success';

  @override
  String get retry => 'Retry';

  @override
  String get refresh => 'Refresh';

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
