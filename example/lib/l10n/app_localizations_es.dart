// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'Ejemplo de i18n Flutter';

  @override
  String get welcome => '¡Bienvenido a Flutter!';

  @override
  String get hello => 'Hola';

  @override
  String helloUser(String name) {
    return '¡Hola, $name!';
  }

  @override
  String itemCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count elementos',
      one: 'Un elemento',
      zero: 'Sin elementos',
    );
    return '$_temp0';
  }

  @override
  String get loginButton => 'Iniciar sesión';

  @override
  String get logoutButton => 'Cerrar sesión';

  @override
  String get profile => 'Perfil';

  @override
  String get settings => 'Configuración';

  @override
  String get language => 'Idioma';

  @override
  String get theme => 'Tema';

  @override
  String get darkMode => 'Modo oscuro';

  @override
  String get save => 'Guardar';

  @override
  String get cancel => 'Cancelar';

  @override
  String get close => 'Cerrar';

  @override
  String get email => 'Correo electrónico';

  @override
  String get password => 'Contraseña';

  @override
  String get confirmPassword => 'Confirmar contraseña';

  @override
  String get invalidEmail => 'Por favor ingrese una dirección de correo válida';

  @override
  String passwordTooShort(int minLength) {
    return 'La contraseña debe tener al menos $minLength caracteres';
  }

  @override
  String get passwordMismatch => 'Las contraseñas no coinciden';

  @override
  String get loginSuccess => '¡Inicio de sesión exitoso!';

  @override
  String get translationInfo => 'Información de traducción';

  @override
  String get partialTranslationWarning =>
      'Esta función tiene traducciones parciales. Algunos idiomas pueden mostrar texto de respaldo.';

  @override
  String get translationStatus => 'Estado de traducción:';

  @override
  String get englishTranslation => 'Inglés';

  @override
  String get chineseTranslation => 'Chino';

  @override
  String get japaneseTranslation => 'Japonés';

  @override
  String get spanishTranslation => 'Español';

  @override
  String get partiallyTranslatedKey => 'Partially Translated Feature';

  @override
  String get firstName => 'Nombre';

  @override
  String get lastName => 'Apellido';

  @override
  String get phoneNumber => 'Número de teléfono';

  @override
  String get address => 'Dirección';

  @override
  String get city => 'Ciudad';

  @override
  String get country => 'País';

  @override
  String get edit => 'Editar';

  @override
  String get delete => 'Eliminar';

  @override
  String get confirm => 'Confirmar';

  @override
  String get loading => 'Cargando...';

  @override
  String get error => 'Error';

  @override
  String get success => 'Éxito';

  @override
  String get retry => 'Reintentar';

  @override
  String get refresh => 'Actualizar';

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
