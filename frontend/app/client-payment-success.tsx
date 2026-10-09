import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';

type Params = {
  contractId?: string | string[];
  projectId?: string | string[];
  milestoneId?: string | string[];
  milestoneTitle?: string | string[];
  totalCharged?: string | string[];
  milestoneAmount?: string | string[];
  platformFee?: string | string[];
  paymentMethod?: string | string[];
  fundingStatus?: string | string[];
};

const firstParam = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
const money = (value?: string | string[]) => {
  const amount = Number(firstParam(value));
  return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function ClientPaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const contractId = firstParam(params.contractId) ?? '';
  const projectId = firstParam(params.projectId) ?? (contractId ? `PRJ-${contractId}` : '');
  const milestoneId = firstParam(params.milestoneId) ?? '';
  const totalCharged = money(params.totalCharged);
  const milestoneTitle = firstParam(params.milestoneTitle) || 'Selected milestone';
  const fundingStatus = (firstParam(params.fundingStatus) || 'FUNDED').replace(/_/g, ' ');

  const viewProject = () => {
    if (!contractId) {
      router.replace('/client-contracts');
      return;
    }
    router.replace({
      pathname: '/client-project-details',
      params: { contractId, projectId, milestoneId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.successIconCircle} accessibilityLabel="Funding status successfully updated">
          <Ionicons name="shield-checkmark-outline" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Milestone Funded{ '\n' }Successfully!</Text>
        <Text style={styles.description}>
          Funding status for <Text style={styles.amount}>{totalCharged}</Text> has been recorded for “{milestoneTitle}”.
          {'\n'}This demo updates the milestone to {fundingStatus}; it does not charge a real card or bank account.
          {'\n'}Funds are intended to be released once the milestone is approved.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={viewProject}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>View Project</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.replace('/client-dashboard')}
          accessibilityRole="button"
        >
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 62,
  },
  successIconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 23,
  },
  amount: {
    color: '#111827',
    fontWeight: '800',
  },
  primaryButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  dashboardButton: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 5,
  },
  dashboardButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
