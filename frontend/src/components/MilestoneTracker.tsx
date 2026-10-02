import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import Theme from '../constants/theme';
import StatusBadge from './StatusBadge';
import { Milestone } from '../types';

interface MilestoneTrackerProps {
  milestone: Milestone;
  onOpenUploadModal?: (milestone: Milestone) => void;
  onFundMilestone?: (milestone: Milestone) => void;
  onReleasePayment?: (milestone: Milestone) => void;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  milestone,
  onOpenUploadModal,
  onFundMilestone,
  onReleasePayment,
}) => {
  const getStepState = (stepIndex: number) => {
    // Step index: 0 = Created, 1 = Funded, 2 = Submitted, 3 = Released
    const { status, deliverables } = milestone;
    const hasDeliverables = deliverables.length > 0;

    if (stepIndex === 0) return 'active';
    if (stepIndex === 1) {
      if (status === 'FUNDED' || status === 'RELEASED') return 'active';
      return 'pending';
    }
    if (stepIndex === 2) {
      if (hasDeliverables || status === 'RELEASED') return 'active';
      if (status === 'FUNDED') return 'current';
      return 'pending';
    }
    if (stepIndex === 3) {
      if (status === 'RELEASED') return 'active';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.dueDate}>Due Date: {milestone.dueDate}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>${milestone.amount.toLocaleString()}</Text>
          <StatusBadge status={milestone.status} size="sm" />
        </View>
      </View>

      <Text style={styles.description}>{milestone.description}</Text>

      {/* Visual Sequence Progress Bar (HCI Milestone 02 Variant 2) */}
      <View style={styles.trackerContainer}>
        <View style={styles.stepsRow}>
          {['Created', 'Funded', 'Submitted', 'Released'].map((label, idx) => {
            const state = getStepState(idx);
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    state === 'active' && styles.circleActive,
                    state === 'current' && styles.circleCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNum,
                      (state === 'active' || state === 'current') && styles.stepNumActive,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Uploaded Deliverables Section */}
      {milestone.deliverables.length > 0 && (
        <View style={styles.deliverablesBox}>
          <Text style={styles.deliverableTitle}>Uploaded Deliverables:</Text>
          {milestone.deliverables.map((item) => (
            <View key={item.id} style={styles.deliverableFile}>
              <Text style={styles.fileName}>📄 {item.fileName}</Text>
              <Text style={styles.fileDate}>{item.uploadedAt}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Contextual Action Buttons */}
      <View style={styles.actionRow}>
        {milestone.status === 'PENDING' && onFundMilestone && (
          <TouchableOpacity
            style={[styles.btn, styles.btnFund]}
            onPress={() => onFundMilestone(milestone)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnFundText}>Fund Escrow (${milestone.amount})</Text>
          </TouchableOpacity>
        )}

        {milestone.status === 'FUNDED' && onOpenUploadModal && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => onOpenUploadModal(milestone)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>Submit Deliverable</Text>
          </TouchableOpacity>
        )}

        {milestone.status === 'FUNDED' && milestone.deliverables.length > 0 && onReleasePayment && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess]}
            onPress={() => onReleasePayment(milestone)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSuccessText}>Release Escrow Payment</Text>
          </TouchableOpacity>
        )}

        {milestone.status === 'RELEASED' && (
          <View style={styles.releasedBanner}>
            <Text style={styles.releasedText}>✓ Payment Released & Settled</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.neutralLight,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.neutralMedium,
    marginVertical: Theme.spacing.xs,
  },
  trackerContainer: {
    marginVertical: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleActive: {
    backgroundColor: Colors.primary,
  },
  circleCurrent: {
    backgroundColor: Colors.warning,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutralMedium,
  },
  stepNumActive: {
    color: Colors.surface,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.neutralMedium,
    fontWeight: '500',
  },
  deliverablesBox: {
    backgroundColor: Colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginTop: Theme.spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  deliverableTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  deliverableFile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  fileName: {
    fontSize: 12,
    color: Colors.dark,
    fontWeight: '500',
  },
  fileDate: {
    fontSize: 11,
    color: Colors.neutralLight,
  },
  actionRow: {
    marginTop: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
  },
  btn: {
    minHeight: Theme.minTouchTarget,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.dark,
  },
  btnPrimaryText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 13,
  },
  btnFund: {
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  btnFundText: {
    color: Colors.warningText,
    fontWeight: '600',
    fontSize: 13,
  },
  btnSuccess: {
    backgroundColor: Colors.primary,
  },
  btnSuccessText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 13,
  },
  releasedBanner: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  releasedText: {
    color: Colors.primaryDark,
    fontWeight: '600',
    fontSize: 12,
  },
});

export default MilestoneTracker;
