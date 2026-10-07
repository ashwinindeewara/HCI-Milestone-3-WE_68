import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import {
  Tone,
  toneColors,
  adminRadius,
  adminSpace,
  adminType,
  adminShadow,
  MUTED_TEXT,
} from '../constants/adminTheme';

/**
 * Shared building blocks for every admin screen. Presentation only: no data fetching or business logic.
 */

export type AdminIconName = React.ComponentProps<typeof Ionicons>['name'];

/* ------------------------------------------------------------------ */
/* Icon                                                                */
/* ------------------------------------------------------------------ */

export function AdminIcon({
  name,
  size = 18,
  color = Colors.neutralMedium,
}: {
  name: AdminIconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

/* ------------------------------------------------------------------ */
/* Card & layout                                                       */
/* ------------------------------------------------------------------ */

export function AdminCard({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function AdminScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderText}>
        <Text style={adminType.pageTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={adminType.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.screenHeaderRight}>{right}</View> : null}
    </View>
  );
}

export function AdminSectionHeader({
  title,
  actionLabel,
  onAction,
  count,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number | string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={adminType.sectionTitle}>{title}</Text>
        {count !== undefined ? (
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card (KPI)                                                     */
/* ------------------------------------------------------------------ */

export function AdminStatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  badge,
  footnote,
  style,
}: {
  label: string;
  value: React.ReactNode;
  icon?: AdminIconName;
  tone?: Tone;
  badge?: string;
  footnote?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = toneColors[tone];
  return (
    <View style={[styles.card, styles.statCard, style]}>
      <View style={[styles.statAccent, { backgroundColor: t.solid }]} />
      <View style={styles.statBody}>
        <View style={styles.statTop}>
          {icon ? (
            <View style={[styles.statIconTile, { backgroundColor: t.bg }]}>
              <Ionicons name={icon} size={18} color={t.fg} />
            </View>
          ) : null}
          {badge ? (
            <View style={[styles.statBadge, { backgroundColor: t.solid }]}>
              <Text style={styles.statBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
        {footnote ? <Text style={styles.statFootnote}>{footnote}</Text> : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export function StatusPill({
  label,
  tone = 'neutral',
  dot = true,
  style,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.pillDot, { backgroundColor: t.solid }]} /> : null}
      <Text style={[styles.pillText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Search & filters                                                    */
/* ------------------------------------------------------------------ */

export function AdminSearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  style,
  ...rest
}: TextInputProps & { value: string; onChangeText: (t: string) => void; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused, style]}>
      <Ionicons name="search-outline" size={18} color={MUTED_TEXT} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED_TEXT}
        style={styles.searchInput}
        accessibilityLabel={placeholder}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={Colors.neutralLight} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type ChipOption = string | { value: string; label: string; count?: number };

export function AdminChips({
  options,
  value,
  onChange,
  style,
}: {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.chipRow, style]}>
      {options.map((option) => {
        const optValue = typeof option === 'string' ? option : option.value;
        const optLabel = typeof option === 'string' ? option : option.label;
        const count = typeof option === 'string' ? undefined : option.count;
        const selected = optValue === value;
        return (
          <TouchableOpacity
            key={optValue}
            onPress={() => onChange(optValue)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{optLabel}</Text>
            {count !== undefined ? (
              <View style={[styles.chipCount, selected && styles.chipCountSelected]}>
                <Text style={[styles.chipCountText, selected && styles.chipCountTextSelected]}>{count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function AdminButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: AdminIconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const solid = variant === 'primary' || variant === 'danger';
  const fg = solid ? Colors.surface : variant === 'ghost' ? Colors.primaryDark : Colors.dark;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        buttonVariant[variant],
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 14 : 16} color={fg} /> : null}
          <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, { color: fg }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function AdminEmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  action,
}: {
  icon?: AdminIconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={MUTED_TEXT} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {action ? <View style={{ marginTop: adminSpace.lg }}>{action}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const buttonVariant = StyleSheet.create({
  primary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  secondary: { backgroundColor: Colors.surface, borderColor: Colors.border },
  danger: { backgroundColor: Colors.error, borderColor: Colors.error },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...adminShadow.card,
  },
  cardPadded: { padding: adminSpace.lg },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpace.md,
    marginBottom: adminSpace.xl,
  },
  screenHeaderText: { flex: 1 },
  screenHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpace.xl,
    marginBottom: adminSpace.md,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpace.sm },
  sectionAction: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  countBubble: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: adminRadius.pill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  countBubbleText: { fontSize: 11, fontWeight: '700', color: Colors.neutralMedium },

  statCard: { flex: 1, minWidth: 150, flexDirection: 'row', overflow: 'hidden' },
  statAccent: { width: 4 },
  statBody: { flex: 1, padding: adminSpace.lg },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpace.md,
    minHeight: 34,
  },
  statIconTile: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: adminRadius.pill },
  statBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.surface, letterSpacing: 0.4 },
  statValue: adminType.stat,
  statLabel: { ...adminType.label, marginTop: 2 },
  statFootnote: { ...adminType.caption, marginTop: 6 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: adminRadius.pill,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpace.md,
    minHeight: 46,
  },
  searchFocused: { borderColor: Colors.primary },
  // The focus ring is drawn on the whole bar, so hide the browser's own square outline inside it
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMedium },
  chipTextSelected: { color: Colors.surface },
  chipCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: adminRadius.pill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  chipCountSelected: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chipCountText: { fontSize: 11, fontWeight: '700', color: Colors.neutralMedium },
  chipCountTextSelected: { color: Colors.surface },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: adminSpace.lg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  buttonSm: { minHeight: 34, paddingHorizontal: adminSpace.md, borderRadius: adminRadius.sm },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  buttonTextSm: { fontSize: 12 },

  empty: { alignItems: 'center', paddingVertical: adminSpace.xxl * 1.5, paddingHorizontal: adminSpace.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpace.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, textAlign: 'center' },
  emptyMessage: { ...adminType.body, textAlign: 'center', marginTop: 4, maxWidth: 320 },
});
