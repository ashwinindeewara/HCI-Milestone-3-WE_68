import Colors from './colors';

export const Theme = {
  // Spacing Scale (8px Grid system as defined in HCI Milestone 02 specs)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  // Corner Radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Typography
  typography: {
    header1: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: Colors.dark,
    },
    header2: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: Colors.dark,
    },
    header3: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: Colors.dark,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: Colors.neutralMedium,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: Colors.neutralLight,
    },
  },

  // Accessibility (Minimum touch target 44x44 px)
  minTouchTarget: 44,

  // Shadows
  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    modal: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export default Theme;
