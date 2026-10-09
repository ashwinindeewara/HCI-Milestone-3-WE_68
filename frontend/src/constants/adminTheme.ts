import { TextStyle, ViewStyle } from 'react-native';
import Colors from './colors';

/**
 * Admin module design tokens.
 * Built entirely on the project palette (Colors) so the admin screens stay consistent with the
 * rest of the app: navy = structure, green = primary action, red / amber / blue = status only.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const toneColors: Record<Tone, { bg: string; fg: string; solid: string; border: string }> = {
  neutral: { bg: '#F3F4F6', fg: Colors.neutralDark, solid: Colors.neutralMedium, border: Colors.border },
  success: { bg: Colors.successBg, fg: Colors.successText, solid: Colors.primary, border: '#BBF7D0' },
  warning: { bg: Colors.warningBg, fg: Colors.warningText, solid: Colors.warning, border: '#FDE68A' },
  danger: { bg: Colors.errorBg, fg: Colors.errorText, solid: Colors.error, border: '#FECACA' },
  info: { bg: Colors.infoBg, fg: Colors.infoText, solid: Colors.info, border: '#BFDBFE' },
};

// Secondary text. Colors.neutralLight (#9CA3AF) is too faint on white, so captions use this.
export const MUTED_TEXT = '#6B7280';

export const adminRadius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const adminSpace = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const adminType = {
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.dark, letterSpacing: -0.3 } as TextStyle,
  pageSubtitle: { fontSize: 13, color: MUTED_TEXT, marginTop: 2 } as TextStyle,
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.dark } as TextStyle,
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark } as TextStyle,
  body: { fontSize: 13, color: Colors.neutralMedium, lineHeight: 19 } as TextStyle,
  label: { fontSize: 12, fontWeight: '600', color: Colors.neutralMedium } as TextStyle,
  caption: { fontSize: 11, color: MUTED_TEXT } as TextStyle,
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: MUTED_TEXT,
  } as TextStyle,
  stat: { fontSize: 26, fontWeight: '800', color: Colors.dark, letterSpacing: -0.5 } as TextStyle,
};

export const adminShadow = {
  card: {
    shadowColor: '#101827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  raised: {
    shadowColor: '#101827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
};

// Content spans the full width of the screen (same as the original admin layout).
export const adminLayout = {
  content: { width: '100%' } as ViewStyle,
  // Clearance so the last item is never hidden behind the bottom tab bar
  bottomClearance: 96,
};

export default {
  toneColors,
  adminRadius,
  adminSpace,
  adminType,
  adminShadow,
  adminLayout,
  MUTED_TEXT,
};
