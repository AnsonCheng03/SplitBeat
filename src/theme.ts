export const darkColors = {
  background: '#0B0F14',
  surface: '#121922',
  surfaceRaised: '#18222D',
  line: '#263240',
  text: '#F3F7FA',
  muted: '#8795A3',
  dim: '#53616F',
  left: '#46D6B3',
  leftSurface: '#102923',
  leftPressed: '#1D483D',
  leftBorder: '#1A4037',
  right: '#AC91FF',
  rightSurface: '#211B34',
  rightPressed: '#382B56',
  rightBorder: '#302747',
  singleHandSurface: '#0E201F',
  singleHandPressed: '#183A35',
  singleHandBorder: '#183D38',
  accent: '#F5C46A',
  danger: '#FF8279',
  beat: '#F5C46A',
};

export const lightColors: typeof darkColors = {
  background: '#F8F8F5',
  surface: '#FFFFFF',
  surfaceRaised: '#F0F1EF',
  line: '#D9DEE2',
  text: '#171B20',
  muted: '#65707A',
  dim: '#89929A',
  left: '#07866C',
  leftSurface: '#E8F7EF',
  leftPressed: '#D2F0E2',
  leftBorder: '#C0E7D3',
  right: '#7044CC',
  rightSurface: '#F2ECFA',
  rightPressed: '#E6D9F6',
  rightBorder: '#D9C8EE',
  singleHandSurface: '#EEF7F4',
  singleHandPressed: '#DDEFE9',
  singleHandBorder: '#CDE7DE',
  accent: '#1674D1',
  danger: '#D93E49',
  beat: '#1682EF',
};

export type ThemeColors = typeof darkColors;

/** Static dark palette retained for non-React domain defaults. UI uses useTheme(). */
export const colors = darkColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};
