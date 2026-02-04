import * as Localization from 'expo-localization';

const STRINGS = {
  'en-US': {
    auth: {
      appName: 'MapFriends',
      loginTitle: 'MapFriends',
      loginSubtitle: 'Log in to see recommendations from your circle.',
      signupTitle: 'Create your profile',
      signupSubtitle: 'Start sharing local favorites.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      togglePasswordVisibility: 'Toggle password visibility',
      forgotPassword: 'Forgot password?',
      loginButton: 'Log in',
      signupButton: 'Create account',
      divider: 'Or continue with',
      socialGoogle: 'Google',
      socialApple: 'Apple',
      noAccount: "Don't have an account?",
      createAccount: 'Create account',
      haveAccount: 'Already have an account?',
      backToLogin: 'Back to log in',
    },
  },
  'pt-BR': {
    auth: {
      appName: 'MapFriends',
      loginTitle: 'MapFriends',
      loginSubtitle: 'Faça login para ver recomendações do seu círculo.',
      signupTitle: 'Crie seu perfil',
      signupSubtitle: 'Comece a compartilhar favoritos locais.',
      nameLabel: 'Nome',
      namePlaceholder: 'Seu nome',
      emailLabel: 'E-mail',
      emailPlaceholder: 'nome@exemplo.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Digite sua senha',
      togglePasswordVisibility: 'Mostrar ou ocultar senha',
      forgotPassword: 'Esqueceu a senha?',
      loginButton: 'Entrar',
      signupButton: 'Criar conta',
      divider: 'Ou continue com',
      socialGoogle: 'Google',
      socialApple: 'Apple',
      noAccount: 'Não tem uma conta?',
      createAccount: 'Criar conta',
      haveAccount: 'Já tem uma conta?',
      backToLogin: 'Voltar para entrar',
    },
  },
} as const;

type SupportedLocale = keyof typeof STRINGS;

function resolveLocale(): SupportedLocale {
  const locale = Localization.getLocales?.()?.[0];
  const tag = (locale?.languageTag || 'en-US').toLowerCase();

  if (tag.startsWith('pt')) {
    return 'pt-BR';
  }

  return 'en-US';
}

export function getStrings() {
  return STRINGS[resolveLocale()];
}
