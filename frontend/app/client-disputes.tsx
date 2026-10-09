import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import { FreelancerApiService, getCurrentUser } from '../src/services/api';

interface ClientDispute {
  id: string;
  project?: string;
  issueType?: string;
  status?: string;
  amount?: number;
  filedDate?: string;
}

export default function ClientDisputesScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const [disputes, setDisputes] = useState<ClientDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDisputes = async () => {
    try {
      const response = await FreelancerApiService.getClientDisputes(user?.fullName, user?.email);
      const data = Array.isArray(response) ? response : response?.data;
      setDisputes(Array.isArray(data) ? data : []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadDisputes();
  }, [user?.email, user?.fullName]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDisputes(); }} />}
      >
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Client Disputes</Text>
            <Text style={styles.subtitle}>Disputes for your projects</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-dispute')}>
            <Text style={styles.createButtonText}>+ Raise Dispute</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={Colors.primary} /> : disputes.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>No Disputes</Text><Text style={styles.emptyText}>Disputes raised by you or a freelancer on your projects will appear here.</Text></View>
        ) : disputes.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/dispute-details', params: { id: item.id } })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.project}>{item.project || 'Project dispute'}</Text>
              <Text style={styles.amount}>${(item.amount || 0).toLocaleString()}</Text>
            </View>
            <Text style={styles.issue}>{item.issueType || 'Dispute'} · {item.filedDate || 'Recently'}</Text>
            <View style={styles.footer}>
              <Text style={styles.status}>{item.status || 'Under Review'}</Text>
              <Text style={styles.open}>View Details & Discussion ›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, gap: 14 },
  back: { color: '#16A34A', fontWeight: '700', fontSize: 15 },
  headerRow: { marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', marginTop: 4 },
  createButton: { backgroundColor: '#16A34A', borderRadius: 8, paddingVertical: 9, paddingHorizontal: 11 },
  createButtonText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  project: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  amount: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  issue: { color: '#64748B' },
  footer: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  status: { color: '#B45309', fontWeight: '700' },
  open: { color: '#16A34A', fontWeight: '700' },
  empty: { backgroundColor: '#FFF', borderRadius: 14, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
