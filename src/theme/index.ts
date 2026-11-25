// KiloFly design system — "Premium nuit & or"
// Deep night-navy surfaces, champagne-gold accents, serif display titles.

export const colors = {
  // surfaces
  bg: '#030F1E',
  bgRaised: '#0A1624',
  card: '#111E2E',
  cardHi: '#172638',
  field: '#0D1A29',
  overlay: 'rgba(3,15,30,0.72)',

  // lines
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderGold: 'rgba(228,188,131,0.55)',

  // text
  text: '#F4F1EA',
  textMuted: 'rgba(232,236,244,0.72)',
  textFaint: 'rgba(232,236,244,0.45)',

  // gold
  gold: '#E4BC83',
  goldBright: '#F3D39B',
  goldDeep: '#C79A58',
  goldSoft: 'rgba(228,188,131,0.12)',
  onGold: '#14110B', // text on gold surfaces

  // status
  success: '#3DBE7A',
  successSoft: 'rgba(61,190,122,0.12)',
  warning: '#E9A23B',
  warningSoft: 'rgba(233,162,59,0.12)',
  danger: '#E5675F',
  dangerSoft: 'rgba(229,103,95,0.10)',
  sky: '#5BB8F0',
} as const;

export const gradients = {
  gold: ['#F2D29C', '#E0B677', '#C99B5A'] as const,
  goldSoft: ['rgba(228,188,131,0.28)', 'rgba(228,188,131,0.10)'] as const,
  card: ['#16253A', '#0F1B2B'] as const,
  header: ['#0B1A2E', '#030F1E'] as const,
  photoFade: ['rgba(3,15,30,0.15)', 'rgba(3,15,30,0.92)'] as const,
  photoLeft: ['rgba(17,30,46,0.97)', 'rgba(17,30,46,0.55)'] as const,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  serif: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_600SemiBold_Italic',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  gold: {
    shadowColor: '#E4BC83',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
