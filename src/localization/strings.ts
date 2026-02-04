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
    terms: {
      title: 'Legal Agreements',
      subtitle: 'Please review our terms to continue using the social map.',
      section1Title: '1. Terms of Service',
      section1Paragraph1:
        'By using our social map recommendation platform, you agree to share your location data and visibility preferences with the followers you have approved. Our subscription model for premium reviews provides access to curated content from verified local experts.',
      section1Paragraph2:
        'You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.',
      section2Title: '2. Privacy Policy Summary',
      section2Paragraph1:
        'Your privacy is our priority. We only show your pins and reviews to people you explicitly follow back. Your location history is encrypted and never sold to third-party advertisers.',
      section2Paragraph2:
        'Premium reviews are subject to specific licensing agreements. Copying or redistributing premium content without a valid subscription is strictly prohibited.',
      section3Title: '3. Community Standards',
      section3Paragraph1:
        'Users must refrain from posting offensive content, spam, or misleading reviews. Violation of community standards may result in temporary or permanent suspension of your account and subscription.',
      acceptTermsPrefix: 'I agree to the ',
      acceptTermsLink: 'Terms of Service',
      acceptPrivacyPrefix: 'I agree to the ',
      acceptPrivacyLink: 'Privacy Policy',
      acceptButton: 'Accept and Continue',
      declineButton: 'Decline and Exit',
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
    terms: {
      title: 'Acordos legais',
      subtitle: 'Revise nossos termos para continuar usando o mapa social.',
      section1Title: '1. Termos de Serviço',
      section1Paragraph1:
        'Ao usar nossa plataforma de recomendações com mapa social, você concorda em compartilhar seus dados de localização e preferências de visibilidade com os seguidores que você aprovou. Nosso modelo de assinatura para avaliações premium oferece acesso a conteúdo curado de especialistas locais verificados.',
      section1Paragraph2:
        'Você é responsável por manter a confidencialidade da sua conta e por todas as atividades realizadas nela. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado.',
      section2Title: '2. Resumo da Política de Privacidade',
      section2Paragraph1:
        'Sua privacidade é nossa prioridade. Só mostramos seus pins e avaliações para pessoas que você segue de volta. Seu histórico de localização é criptografado e nunca é vendido a anunciantes terceiros.',
      section2Paragraph2:
        'Avaliações premium estão sujeitas a acordos específicos de licenciamento. Copiar ou redistribuir conteúdo premium sem uma assinatura válida é estritamente proibido.',
      section3Title: '3. Padrões da Comunidade',
      section3Paragraph1:
        'Os usuários devem se abster de publicar conteúdo ofensivo, spam ou avaliações enganosas. A violação dos padrões da comunidade pode resultar em suspensão temporária ou permanente da sua conta e assinatura.',
      acceptTermsPrefix: 'Concordo com os ',
      acceptTermsLink: 'Termos de Serviço',
      acceptPrivacyPrefix: 'Concordo com a ',
      acceptPrivacyLink: 'Política de Privacidade',
      acceptButton: 'Aceitar e continuar',
      declineButton: 'Recusar e sair',
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
