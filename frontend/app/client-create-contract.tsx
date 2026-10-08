import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import apiClient from '../src/services/api';

interface Deliverable {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
}

interface Milestone {
  id?: string;
  title?: string;
  description?: string;
  amount?: number | string;
  dueDate?: string;
  status?: string;
}

interface ContractData {
  id: string;
  title?: string;
  projectName?: string;
  description?: string;
  scopeOfWork?: string;
  minimumRequirements?: string;
  clientName?: string;
  freelancerName?: string;
  freelancerId?: number | string;
  totalBudget?: number | string;
  paymentStrategy?: string;
  paymentTerms?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyDeliverables?: Deliverable[] | string | null;
  milestones?: Milestone[] | null;
}

const formatDate = (value?: string) => {
  if (!value) return 'Date not set';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMoney = (value?: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0';
  return `$${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })}`;
};

const normalizeDeliverables = (
  value: ContractData['keyDeliverables'],
): Deliverable[] => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n|•|-/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: `deliverable-${index}`,
        title,
      }));
  }

  return [];
};

const normalizeMilestones = (value: ContractData['milestones']) => {
  return Array.isArray(value) ? value : [];
};

export default function CreateContractScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadContract = useCallback(async () => {
    if (!id) {
      setErrorMessage('No contract ID was provided.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      console.log('========== CREATE CONTRACT =========');
      console.log('Contract ID:', id);

      const response = await apiClient.get(`/contracts/${encodeURIComponent(String(id))}`, {
        timeout: 10000,
      });

      console.log('Contract API status:', response.status);
      console.log('Contract API response:', response.data);

      setContract(response.data);
    } catch (error: any) {
      console.error('Failed to load contract:', error);
      console.error('URL:', error?.config?.url);
      console.error('Response:', error?.response?.data);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to load contract details.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const deliverables = useMemo(
    () => normalizeDeliverables(contract?.keyDeliverables),
    [contract?.keyDeliverables],
  );

  const milestones = useMemo(
    () => normalizeMilestones(contract?.milestones),
    [contract?.milestones],
  );

  const totalBudget = useMemo(() => {
    if (contract?.totalBudget !== undefined && contract?.totalBudget !== null) {
      return Number(contract.totalBudget) || 0;
    }

    return milestones.reduce(
      (sum, milestone) => sum + (Number(milestone.amount) || 0),
      0,
    );
  }, [contract?.totalBudget, milestones]);

  const paymentLabel = useMemo(() => {
    const value = contract?.paymentTerms || contract?.paymentStrategy;

    if (!value) return 'Milestone-based Escrow';

    return String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [contract?.paymentTerms, contract?.paymentStrategy]);

  const handlePreview = () => {
    if (!contract?.id) return;

    router.push({
      pathname: '/(tabs)/contract-preview',
      params: { id: contract.id },
    });
  };

  const handleSendContract = async () => {
    if (!contract?.id) return;

    try {
      setSending(true);
      setSuccessMessage('');

      console.log('Sending contract:', contract.id);

      // Your backend already exposes PATCH /api/contracts/{id}/status
      const response = await apiClient.patch(
        `/contracts/${encodeURIComponent(String(contract.id))}/status`,
        null,
        {
          params: { status: 'PENDING' },
          timeout: 10000,
        },
      );

      console.log('Contract status updated:', response.data);

      setContract(response.data);
      setSuccessMessage(
        `Draft saved and ready to send to ${response.data?.freelancerName || contract.freelancerName || 'the freelancer'}.`,
      );
    } catch (error: any) {
      console.error('Failed to send contract:', error);
      console.error('Response:', error?.response?.data);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to send the contract.',
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.stateText}>Loading contract...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && !contract) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Unable to load contract</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadContract}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const projectName = contract?.title || contract?.projectName || 'Untitled Project';
  const freelancerName = contract?.freelancerName || 'Freelancer not selected';
  const scope = contract?.scopeOfWork || contract?.description || 'No scope of work has been added.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backGlyph}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Contract</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Project Name */}
          <Text style={styles.fieldLabel}>Project Name</Text>
          <TouchableOpacity
            style={styles.projectSelector}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text numberOfLines={1} style={styles.projectName}>
              {projectName}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>

          {/* Freelancer */}
          <Text style={styles.fieldLabel}>Freelancer</Text>
          <View style={styles.freelancerChip}>
            <View style={styles.freelancerAvatar}>
              <Text style={styles.freelancerInitial}>
                {freelancerName.trim().charAt(0).toUpperCase() || 'F'}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.freelancerName}>
              {freelancerName}
            </Text>
          </View>

          {/* Scope of Work */}
          <Text style={styles.fieldLabel}>Scope of Work</Text>
          <View style={styles.scopeCard}>
            <Text style={styles.scopeText}>{scope}</Text>
          </View>

          {/* Deliverables */}
          <Text style={styles.fieldLabel}>Deliverables</Text>
          <View style={styles.deliverablesBlock}>
            {deliverables.length > 0 ? (
              deliverables.map((item, index) => (
                <View style={styles.deliverableRow} key={item.id || `${item.title}-${index}`}>
                  <View style={styles.greenBullet} />
                  <Text style={styles.deliverableText} numberOfLines={2}>
                    {item.title || item.name || `Deliverable ${index + 1}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No deliverables added.</Text>
            )}
          </View>

          {/* Milestones */}
          <Text style={styles.fieldLabel}>Milestones Schedule</Text>
          <View style={styles.milestonesBlock}>
            {milestones.length > 0 ? (
              milestones.map((milestone, index) => (
                <View style={styles.milestoneCard} key={milestone.id || `${milestone.title}-${index}`}>
                  <View style={styles.milestoneCopy}>
                    <Text style={styles.milestoneTitle} numberOfLines={1}>
                      {index + 1}. {milestone.title || `Milestone ${index + 1}`}
                    </Text>
                    <Text style={styles.milestoneDate}>
                      Due {formatDate(milestone.dueDate)}
                    </Text>
                  </View>

                  <Text style={styles.milestoneAmount}>
                    {formatMoney(milestone.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No milestones added.</Text>
            )}
          </View>

          {/* Payment Terms */}
          <View style={styles.paymentHeaderRow}>
            <View>
              <Text style={styles.fieldLabelNoMargin}>Payment Terms</Text>
              <Text style={styles.paymentSubtext}>Milestone-based Escrow</Text>
            </View>

            <TouchableOpacity onPress={handlePreview} activeOpacity={0.7}>
              <Text style={styles.previewLink}>Contract Preview ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>{formatMoney(totalBudget)}</Text>
          </View>

          {/* Send Contract */}
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.buttonDisabled]}
            onPress={handleSendContract}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.sendButtonText}>Send Contract</Text>
            )}
          </TouchableOpacity>

          {/* Success banner */}
          {successMessage ? (
            <View style={styles.successBanner}>
              <View style={styles.successIcon} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Error when contract is loaded */}
          {errorMessage ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  stateText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
  },
  errorTitle: {
    color: Colors.dark,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: Theme.spacing.sm,
    color: Colors.neutralMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Theme.spacing.md,
    minWidth: 100,
    minHeight: 42,
    paddingHorizontal: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  backLink: {
    marginTop: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  backLinkText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 42,
    justifyContent: 'center',
  },
  backGlyph: {
    color: Colors.dark,
    fontSize: 30,
    lineHeight: 34,
  },
  headerTitle: {
    color: Colors.dark,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  fieldLabel: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  fieldLabelNoMargin: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '700',
  },
  projectSelector: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 10,
  },
  projectName: {
    flex: 1,
    color: Colors.dark,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  chevron: {
    color: Colors.neutralMedium,
    fontSize: 17,
    lineHeight: 18,
  },
  freelancerChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 9,
    minHeight: 30,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freelancerAvatar: {
    width: 26,
    height: 26,
    marginLeft: 2,
    marginRight: 6,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freelancerInitial: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  freelancerName: {
    maxWidth: 180,
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '600',
  },
  scopeCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  scopeText: {
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 15,
  },
  deliverablesBlock: {
    paddingVertical: 1,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingRight: 8,
  },
  greenBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 4,
    marginRight: 6,
  },
  deliverableText: {
    flex: 1,
    color: Colors.neutralMedium,
    fontSize: 10,
    lineHeight: 14,
  },
  milestonesBlock: {
    gap: 6,
  },
  milestoneCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  milestoneCopy: {
    flex: 1,
    paddingRight: 8,
  },
  milestoneTitle: {
    color: Colors.dark,
    fontSize: 10,
    fontWeight: '800',
  },
  milestoneDate: {
    color: Colors.neutralMedium,
    fontSize: 8,
    marginTop: 3,
  },
  milestoneAmount: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  paymentHeaderRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  paymentSubtext: {
    color: Colors.neutralMedium,
    fontSize: 8,
    marginTop: 2,
  },
  previewLink: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '700',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  budgetLabel: {
    color: Colors.neutralMedium,
    fontSize: 9,
  },
  budgetValue: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '800',
  },
  sendButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  sendButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successBanner: {
    marginTop: 10,
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#F0FDF4',
    borderRadius: Theme.borderRadius.md,
  },
  successIcon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    marginRight: 7,
  },
  successText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '600',
  },
  inlineError: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: Theme.borderRadius.md,
  },
  inlineErrorText: {
    color: Colors.error,
    fontSize: 9,
    lineHeight: 13,
  },
  emptyText: {
    color: Colors.neutralLight,
    fontSize: 9,
  },
});
