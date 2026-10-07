import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
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
import { AdminIconName, StatusPill } from './AdminUI';

/**
 * Shared modal shell and the form / detail pieces used inside admin modals.
 * Presentation only: every screen keeps its own state and handlers.
 */

/* ------------------------------------------------------------------ */
/* Modal shell                                                         */
/* ------------------------------------------------------------------ */

interface AdminModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: AdminIconName;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const MAX_WIDTH = { sm: 400, md: 480, lg: 580 };

export default function AdminModal({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  tone = 'neutral',
  size = 'md',
  footer,
  children,
}: AdminModalProps) {
  const t = toneColors[tone];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { maxWidth: MAX_WIDTH[size] }]}>
          <View style={styles.header}>
            {icon ? (
              <View style={[styles.headerIcon, { backgroundColor: t.bg }]}>
                <Ionicons name={icon} size={20} color={t.fg} />
              </View>
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={Colors.neutralMedium} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

interface AdminFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  helper?: string;
}

export function AdminField({ label, required, helper, style, multiline, ...inputProps }: AdminFieldProps) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={MUTED_TEXT}
        multiline={multiline}
        {...inputProps}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

type ChoiceOption = string | { value: string; label: string };

export function AdminChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const optValue = typeof option === 'string' ? option : option.value;
          const optLabel = typeof option === 'string' ? option : option.label;
          const selected = optValue === value;
          return (
            <TouchableOpacity
              key={optValue}
              onPress={() => onChange(optValue)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.choiceChip, selected && styles.choiceChipSelected]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{optLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Content blocks                                                      */
/* ------------------------------------------------------------------ */

export function AdminSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function AdminTag({
  label,
  tone = 'neutral',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  return <StatusPill label={label} tone={tone} style={style} />;
}

const NOTICE_ICON: Record<Tone, AdminIconName> = {
  neutral: 'information-circle-outline',
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  danger: 'alert-circle-outline',
};

export function AdminNotice({ tone = 'info', children }: { tone?: Tone; children: React.ReactNode }) {
  const t = toneColors[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Ionicons name={NOTICE_ICON[tone]} size={18} color={t.fg} style={styles.noticeIcon} />
      <Text style={[styles.noticeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

interface AdminDetailRow {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
}

export function AdminDetailList({ rows }: { rows: AdminDetailRow[] }) {
  return (
    <View style={styles.detailList}>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={[styles.detailRow, index === rows.length - 1 && styles.detailRowLast]}
        >
          <Text style={styles.detailLabel}>{row.label}</Text>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            <Text
              style={[
                styles.detailValue,
                row.tone && row.tone !== 'neutral' ? { color: toneColors[row.tone].fg } : null,
              ]}
            >
              {row.value}
            </Text>
          ) : (
            <View style={styles.detailValueBox}>{row.value}</View>
          )}
        </View>
      ))}
    </View>
  );
}

export function AdminActionList({ children }: { children: React.ReactNode }) {
  return <View style={styles.actionList}>{children}</View>;
}

export function AdminActionRow({
  icon,
  label,
  onPress,
  tone = 'neutral',
  disabled,
  last,
}: {
  icon?: AdminIconName;
  label: string;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  last?: boolean;
}) {
  const t = toneColors[tone];
  const color = tone === 'neutral' ? Colors.dark : t.fg;
  const pressable = !!onPress && !disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!pressable}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled: !pressable }}
      style={[styles.actionRow, last && styles.actionRowLast, disabled && styles.actionRowDisabled]}
    >
      {icon ? (
        <View style={[styles.actionIconTile, { backgroundColor: t.bg }]}>
          <Ionicons name={icon} size={16} color={t.fg} />
        </View>
      ) : null}
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.neutralLight} /> : null}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpace.lg,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.surface,
    borderRadius: adminRadius.lg + 4,
    overflow: 'hidden',
    ...adminShadow.raised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    paddingHorizontal: adminSpace.xl,
    paddingTop: adminSpace.xl,
    paddingBottom: adminSpace.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark, letterSpacing: -0.2 },
  subtitle: { ...adminType.pageSubtitle },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: adminSpace.xl, paddingBottom: adminSpace.xl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpace.sm,
    paddingHorizontal: adminSpace.xl,
    paddingVertical: adminSpace.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },

  fieldBox: { marginBottom: adminSpace.lg },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  requiredMark: { color: Colors.error },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: adminSpace.md + 2,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.dark,
    // Match the palette: green focus outline instead of the browser's default blue
    ...(Platform.OS === 'web' ? ({ outlineColor: Colors.primary } as object) : null),
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  helper: { ...adminType.caption, marginTop: 5 },

  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpace.sm },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  choiceChipSelected: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  choiceText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMedium },
  choiceTextSelected: { color: Colors.surface },

  sectionTitle: { ...adminType.overline, marginTop: adminSpace.md, marginBottom: adminSpace.sm },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpace.sm,
    borderWidth: 1,
    borderRadius: adminRadius.md,
    padding: adminSpace.md,
    marginBottom: adminSpace.lg,
  },
  noticeIcon: { marginTop: 1 },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },

  detailList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    marginBottom: adminSpace.lg,
    backgroundColor: Colors.surface,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: adminSpace.lg,
    paddingHorizontal: adminSpace.md + 2,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 12, color: MUTED_TEXT, fontWeight: '600' },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '700', color: Colors.dark },
  detailValueBox: { flex: 1, alignItems: 'flex-end' },

  actionList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: adminRadius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    paddingHorizontal: adminSpace.md + 2,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionRowDisabled: { opacity: 0.5 },
  actionIconTile: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
});
