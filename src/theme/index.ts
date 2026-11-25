// KiloFly design system — "Premium voyage"
// Deep navy like an airline night cabin, gold taken from the suitcase in the logo,
// and the brand sky-cyan kept as a secondary accent.

export const colors = {
  ink: '#0A1633', // darkest navy, headers & primary text
  navy: '#0E2A80', // brand primary
  navySoft: '#1B3A94',
  sky: '#2FB3E3', // brand cyan
  gold: '#F5B83D', // premium accent (logo suitcase)
  goldSoft: '#FFF3DA',

  bg: '#F4F6FB',
  card: '#FFFFFF',
  text: '#0A1633',
  textMuted: '#6B7491',
  textFaint: '#9AA2BA',
  border: '#E5E9F2',
  line: '#D5DBEA',

  success: '#1FA971',
  successSoft: '#E3F6EE',
  warning: '#E8912D',
  warningSoft: '#FDF0E1',
  danger: '#E5484D',
  dangerSoft: '#FDE8E8',

  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.65)',
  onDarkFaint: 'rgba(255,255,255,0.14)',
} as const;

export const gradients = {
  night: ['#0A1633', '#0E2A80'] as const,
  cabin: ['#0E2A80', '#1B5FB8'] as const,
  gold: ['#F8C95A', '#F0A52A'] as const,
  photoFade: ['rgba(10,22,51,0)', 'rgba(10,22,51,0.85)'] as const,
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: {
    shadowColor: '#0A1633',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  float: {
    shadowColor: '#0A1633',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};
