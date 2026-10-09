import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/constants/colors';
import apiClient from '../src/services/api';

type Raw = Record<string, any>;

type DetailMilestone = {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
};

type DetailFile = {
  id: string;
  name: string;
  description: string;
  size: string;
  url?: string;
};

type DetailActivity = {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  createdAt: string;
};

type ProjectDetails = {
  contractId: string;
  projectId: string;
  title: string;
  clientName: string;
  freelancerName: string;
  freelancerEmail: string;
  status: string;
  description: string;
  scopeOfWork: string;
  minimumRequirements: string;
  paymentTerms: string;
  totalBudget: number;
  escrowAmount: number;
  timeline: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  deliverables: string[];
  milestones: DetailMilestone[];
};

type RouteParams = {
  id?: string | string[];
  contractId?: string | string[];
  projectId?: string | string[];
  milestoneId?: string | string[];
};

const firstParam = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
const textValue = (value: unknown, fallback = '') => value === null || value === undefined ? fallback : String(value);
const numberValue = (value: unknown, fallback = 0) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
};
const formatMoney = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value?: string) => {
  if (!value) return 'Not set';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const normalizeObject = (value: any): Raw => value?.project ?? value?.contract ?? value?.data ?? value ?? {};
const normalizeList = (value: any): Raw[] => {
  const unwrapped = value?.items ?? value?.content ?? value?.data ?? value;
  return Array.isArray(unwrapped) ? unwrapped : [];
};
const statusLabel = (value: string) => (value || 'UNKNOWN').replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

function mapMilestones(rawItems: Raw[]): DetailMilestone[] {
  return rawItems.map((item, index) => ({
    id: textValue(item?.id ?? item?.milestoneId, `milestone-${index + 1}`),
    title: textValue(item?.title ?? item?.name, `Milestone ${index + 1}`),
    description: textValue(item?.description ?? item?.details),
    amount: numberValue(item?.amount ?? item?.budget ?? item?.escrowAmount),
    dueDate: textValue(item?.dueDate ?? item?.deadline ?? item?.submissionDeadline),
    status: textValue(item?.status, 'PENDING'),
  }));
}

function mapDeliverables(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item: any) => typeof item === 'string'
      ? item.trim()
      : textValue(item?.title ?? item?.name ?? item?.fileName ?? item?.description).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export default function ClientProjectDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const routeId = firstParam(params.contractId) ?? firstParam(params.id) ?? firstParam(params.projectId) ?? '';
  const contractId = routeId.startsWith('PRJ-') ? routeId.slice(4) : routeId;
  const projectId = firstParam(params.projectId) || (contractId ? `PRJ-${contractId}` : '');
  const highlightedMilestoneId = firstParam(params.milestoneId) ?? '';

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [files, setFiles] = useState<DetailFile[]>([]);
  const [activities, setActivities] = useState<DetailActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDetails = useCallback(async (isRefresh = false) => {
    if (!contractId) {
      setErrorMessage('No contract ID was provided. Return to your projects list and open the project again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');

    try {
      // Contract data is the required source for project title, budget, requirements and milestones.
      const contractResponse = await apiClient.get(`/contracts/${encodeURIComponent(contractId)}`, { timeout: 15000 });
      const contractRaw = normalizeObject(contractResponse.data);
      if (!textValue(contractRaw?.id ?? contractRaw?.contractId)) {
        throw new Error('The API response did not contain a valid contract.');
      }

      // Project, milestones, activity and file APIs are additional details. If any optional
      // route is not available, keep rendering the contract details that were loaded above.
      const getOptional = async (url: string) => {
        try {
          const response = await apiClient.get(url, { timeout: 10000 });
          return response.data;
        } catch (error: any) {
          console.info(`[ProjectDetails] Optional endpoint unavailable: ${url}`, error?.response?.status ?? error?.message);
          return null;
        }
      };

      const [projectResponse, milestonesResponse, activityResponse, filesResponse] = await Promise.all([
        getOptional(`/projects/${encodeURIComponent(projectId)}`),
        getOptional(`/projects/${encodeURIComponent(projectId)}/milestones`),
        getOptional(`/projects/${encodeURIComponent(projectId)}/activities`),
        getOptional(`/projects/${encodeURIComponent(projectId)}/files`),
      ]);

      const projectRaw = projectResponse ? normalizeObject(projectResponse) : {};
      const contractMilestones = mapMilestones(Array.isArray(contractRaw.milestones)
        ? contractRaw.milestones
        : Array.isArray(contractRaw.projectMilestones) ? contractRaw.projectMilestones : []);
      const projectMilestones = milestonesResponse ? mapMilestones(normalizeList(milestonesResponse)) : [];
      const milestones = projectMilestones.length > 0 ? projectMilestones : contractMilestones;
      const keyDeliverables = mapDeliverables(contractRaw.keyDeliverables ?? contractRaw.deliverables ?? contractRaw.deliverableSummary);

      const mapped: ProjectDetails = {
        contractId: textValue(contractRaw.id ?? contractRaw.contractId, contractId),
        projectId: textValue(projectRaw.id ?? projectRaw.projectId, projectId),
        title: textValue(projectRaw.title ?? projectRaw.projectName ?? contractRaw.title ?? contractRaw.projectName, 'Untitled project'),
        clientName: textValue(projectRaw.clientName ?? projectRaw.client?.fullName ?? contractRaw.clientName ?? contractRaw.client?.fullName, 'Client'),
        freelancerName: textValue(projectRaw.freelancerName ?? projectRaw.freelancer?.fullName ?? contractRaw.freelancerName ?? contractRaw.freelancer?.fullName, 'Freelancer'),
        freelancerEmail: textValue(projectRaw.freelancerEmail ?? contractRaw.freelancerEmail),
        status: textValue(projectRaw.status ?? contractRaw.status, 'UNKNOWN'),
        description: textValue(projectRaw.description ?? contractRaw.description),
        scopeOfWork: textValue(projectRaw.scopeOfWork ?? contractRaw.scopeOfWork),
        minimumRequirements: textValue(projectRaw.minimumRequirements ?? contractRaw.minimumRequirements),
        paymentTerms: textValue(projectRaw.paymentTerms ?? projectRaw.paymentStrategy ?? contractRaw.paymentTerms ?? contractRaw.paymentStrategy),
        totalBudget: numberValue(projectRaw.totalBudget ?? projectRaw.budget ?? contractRaw.totalBudget ?? contractRaw.budget),
        escrowAmount: numberValue(projectRaw.inEscrowAmount ?? projectRaw.escrowAmount ?? contractRaw.inEscrowAmount ?? contractRaw.escrowAmount),
        timeline: textValue(projectRaw.timeline ?? contractRaw.timeline),
        startDate: textValue(projectRaw.startDate ?? contractRaw.startDate),
        endDate: textValue(projectRaw.endDate ?? contractRaw.endDate),
        dueDate: textValue(projectRaw.dueDate ?? contractRaw.dueDate ?? contractRaw.endDate),
        deliverables: keyDeliverables,
        milestones,
      };

      const rawFiles = filesResponse ? normalizeList(filesResponse) : [];
      const mappedFiles = rawFiles.map((item, index) => ({
        id: textValue(item?.id ?? item?.fileId, `file-${index + 1}`),
        name: textValue(item?.originalFileName ?? item?.fileName ?? item?.filename ?? item?.name, `File ${index + 1}`),
        description: textValue(item?.description ?? item?.contentType),
        size: textValue(item?.fileSizeLabel ?? item?.sizeLabel ?? item?.size),
        url: textValue(item?.downloadUrl ?? item?.fileUrl ?? item?.url ?? item?.downloadLink) || undefined,
      }));
      const rawActivities = activityResponse ? normalizeList(activityResponse) : [];
      const mappedActivities = rawActivities.map((item, index) => ({
        id: textValue(item?.id, `activity-${index + 1}`),
        type: textValue(item?.type, 'PROJECT_UPDATE'),
        description: textValue(item?.description ?? item?.message, ''),
        performedBy: textValue(item?.performedBy ?? item?.actorName, 'Project member'),
        createdAt: textValue(item?.createdAt ?? item?.timestamp),
      }));

      setProject(mapped);
      setFiles(mappedFiles);
      setActivities(mappedActivities);
      console.log('[ProjectDetails] Loaded project details:', {
        contractId: mapped.contractId,
        projectId: mapped.projectId,
        milestones: mapped.milestones.length,
        files: mappedFiles.length,
        activities: mappedActivities.length,
      });
    } catch (error: any) {
      console.error('[ProjectDetails] Failed to load project:', error);
      console.error('URL:', error?.config?.url);
      console.error('Status:', error?.response?.status);
      console.error('Response:', error?.response?.data);
      setErrorMessage(error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? 'Unable to load project details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contractId, projectId]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  const selectedMilestone = useMemo(
    () => project?.milestones.find((item) => item.id === highlightedMilestoneId) ?? project?.milestones[0] ?? null,
    [project, highlightedMilestoneId],
  );

  const openFile = async (item: DetailFile) => {
    if (!item.url) {
      Alert.alert('File link unavailable', 'The backend returned this file record without a download URL.');
      return;
    }
    try {
      await Linking.openURL(item.url);
    } catch (error) {
      console.error('[ProjectDetails] Unable to open file:', error);
      Alert.alert('Unable to open file', 'Check that the file URL is valid and accessible.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading project details...</Text>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.centerState}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
        <Text style={styles.stateTitle}>Unable to load project</Text>
        <Text style={styles.stateText}>{errorMessage || 'Project details are not available.'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => loadDetails()}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/client-contracts')}>
          <Text style={styles.secondaryButtonText}>Back to My Projects</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>PROJECT DETAILS</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{project.title}</Text>
          </View>
          <TouchableOpacity onPress={() => loadDetails(true)} style={styles.refreshButton} accessibilityLabel="Refresh project details">
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDetails(true)} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.statusPill}><Text style={styles.statusPillText}>{statusLabel(project.status)}</Text></View>
              <Text style={styles.projectId}>{project.projectId}</Text>
            </View>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectDescription}>{project.description || 'No project description was provided.'}</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>TOTAL BUDGET</Text>
                <Text style={styles.metricValue}>{formatMoney(project.totalBudget)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>IN ESCROW</Text>
                <Text style={[styles.metricValue, styles.greenValue]}>{formatMoney(project.escrowAmount)}</Text>
              </View>
            </View>
          </View>

          <SectionTitle title="Project Information" />
          <View style={styles.card}>
            <InfoRow label="Client" value={project.clientName} icon="business-outline" />
            <InfoRow label="Freelancer" value={project.freelancerName} icon="person-outline" />
            {!!project.freelancerEmail && <InfoRow label="Freelancer email" value={project.freelancerEmail} icon="mail-outline" />}
            <InfoRow label="Start date" value={formatDate(project.startDate)} icon="calendar-outline" />
            <InfoRow label="Due date" value={formatDate(project.dueDate || project.endDate)} icon="flag-outline" />
            <InfoRow label="Timeline" value={project.timeline || `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`} icon="time-outline" />
            <InfoRow label="Payment terms" value={project.paymentTerms ? statusLabel(project.paymentTerms) : 'Not specified'} icon="card-outline" last />
          </View>

          <SectionTitle title="Scope of Work" />
          <View style={styles.card}>
            <Text style={styles.bodyText}>{project.scopeOfWork || 'No scope of work was provided.'}</Text>
          </View>

          <SectionTitle title="Minimum Requirements" />
          <View style={styles.card}>
            <Text style={styles.bodyText}>{project.minimumRequirements || 'No minimum requirements were provided.'}</Text>
          </View>

          <SectionTitle title={`Key Deliverables (${project.deliverables.length})`} />
          <View style={styles.card}>
            {project.deliverables.length ? project.deliverables.map((item, index) => (
              <View key={`${index}-${item}`} style={styles.deliverableRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.deliverableText}>{item}</Text>
              </View>
            )) : <EmptyText text="No key deliverables are recorded for this project." />}
          </View>

          <SectionTitle title={`Milestones (${project.milestones.length})`} />
          {project.milestones.length ? project.milestones.map((item, index) => {
            const highlighted = item.id === highlightedMilestoneId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.milestoneCard, highlighted && styles.milestoneCardHighlighted]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/client-milestone-review', params: { contractId: project.contractId, projectId: project.projectId, milestoneId: item.id } })}
              >
                <View style={styles.milestoneHeader}>
                  <View style={styles.milestoneNumber}><Text style={styles.milestoneNumberText}>{index + 1}</Text></View>
                  <View style={styles.milestoneCopy}>
                    <Text style={styles.milestoneTitle}>{item.title}</Text>
                    <Text style={styles.milestoneDue}>Due {formatDate(item.dueDate)}</Text>
                  </View>
                  <Text style={styles.milestoneAmount}>{formatMoney(item.amount)}</Text>
                </View>
                {item.description ? <Text style={styles.bodyText}>{item.description}</Text> : null}
                <View style={styles.milestoneFooter}>
                  <View style={styles.miniStatus}><Text style={styles.miniStatusText}>{statusLabel(item.status)}</Text></View>
                  <Text style={styles.detailLink}>{highlighted ? 'Selected milestone' : 'View milestone'} ›</Text>
                </View>
              </TouchableOpacity>
            );
          }) : <View style={styles.card}><EmptyText text="No milestones are currently recorded." /></View>}

          <SectionTitle title={`Project Files (${files.length})`} />
          <View style={styles.card}>
            {files.length ? files.map((item) => (
              <TouchableOpacity key={item.id} style={styles.fileRow} onPress={() => openFile(item)} activeOpacity={0.8}>
                <View style={styles.fileIcon}><Ionicons name="document-text-outline" size={20} color={Colors.primary} /></View>
                <View style={styles.fileCopy}>
                  <Text style={styles.fileName} numberOfLines={2}>{item.name}</Text>
                  {!!item.description && <Text style={styles.fileMeta}>{item.description}</Text>}
                  {!!item.size && <Text style={styles.fileMeta}>{item.size}</Text>}
                </View>
                <Ionicons name="download-outline" size={18} color={Colors.neutralMedium} />
              </TouchableOpacity>
            )) : <EmptyText text="No project files have been uploaded yet." />}
          </View>

          <SectionTitle title={`Recent Activity (${activities.length})`} />
          <View style={styles.card}>
            {activities.length ? activities.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{statusLabel(item.type)}</Text>
                  <Text style={styles.bodyText}>{item.description || 'Project updated.'}</Text>
                  <Text style={styles.activityMeta}>{item.performedBy} · {formatDate(item.createdAt)}</Text>
                </View>
              </View>
            )) : <EmptyText text="No activity has been recorded for this project yet." />}
          </View>

          {!!errorMessage && <Text style={styles.inlineWarning}>Some supplementary details could not be loaded: {errorMessage}</Text>}

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push({ pathname: '/client-milestone-review', params: { contractId: project.contractId, projectId: project.projectId, milestoneId: selectedMilestone?.id ?? highlightedMilestoneId } })}
            >
              <Text style={styles.primaryButtonText}>Open Milestone Review</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/client-contracts')}>
              <Text style={styles.secondaryButtonText}>Back to My Projects</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}
function EmptyText({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}
function InfoRow({ label, value, icon, last = false }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Ionicons name={icon} size={16} color={Colors.neutralMedium} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F4F7FB' },
  stateTitle: { marginTop: 10, color: Colors.dark, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateText: { marginTop: 8, color: Colors.neutralMedium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#101828', gap: 10 },
  headerBack: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerEyebrow: { color: '#A7F3D0', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 3 },
  refreshButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 15, paddingBottom: 36, maxWidth: 900, width: '100%', alignSelf: 'center' },
  heroCard: { padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF', borderRadius: 15, marginBottom: 7 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#DCFCE7', borderRadius: 20 },
  statusPillText: { color: '#15803D', fontSize: 9, fontWeight: '900' },
  projectId: { color: Colors.neutralMedium, fontSize: 9 },
  projectTitle: { marginTop: 12, color: Colors.dark, fontSize: 20, lineHeight: 26, fontWeight: '900' },
  projectDescription: { marginTop: 7, color: Colors.neutralMedium, fontSize: 12, lineHeight: 18 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E8EDF3' },
  metricBlock: { flex: 1 },
  metricDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB', marginHorizontal: 14 },
  metricLabel: { color: Colors.neutralMedium, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  metricValue: { marginTop: 5, color: Colors.dark, fontSize: 16, fontWeight: '900' },
  greenValue: { color: Colors.primaryDark },
  sectionTitle: { marginTop: 19, marginBottom: 8, color: Colors.dark, fontSize: 14, fontWeight: '900' },
  card: { padding: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF', borderRadius: 12 },
  infoRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#F0F2F5', paddingVertical: 8 },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { width: 105, color: Colors.neutralMedium, fontSize: 11 },
  infoValue: { flex: 1, color: Colors.dark, fontSize: 11, fontWeight: '700' },
  bodyText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  deliverableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 5 },
  deliverableText: { flex: 1, color: '#344054', fontSize: 12, lineHeight: 18 },
  emptyText: { color: Colors.neutralMedium, fontSize: 11, lineHeight: 17 },
  milestoneCard: { padding: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E8EF', borderRadius: 12, marginBottom: 8 },
  milestoneCardHighlighted: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  milestoneHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  milestoneNumber: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  milestoneNumberText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '900' },
  milestoneCopy: { flex: 1 },
  milestoneTitle: { color: Colors.dark, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  milestoneDue: { marginTop: 3, color: Colors.neutralMedium, fontSize: 10 },
  milestoneAmount: { color: Colors.primaryDark, fontSize: 12, fontWeight: '900' },
  milestoneFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F2F4F7' },
  miniStatusText: { color: '#475467', fontSize: 9, fontWeight: '800' },
  detailLink: { color: Colors.primaryDark, fontSize: 10, fontWeight: '800' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  fileIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  fileName: { color: Colors.dark, fontSize: 11, fontWeight: '800' },
  fileMeta: { color: Colors.neutralMedium, fontSize: 9, marginTop: 3 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  activityDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 5 },
  activityCopy: { flex: 1, gap: 3 },
  activityTitle: { color: Colors.dark, fontSize: 11, fontWeight: '800' },
  activityMeta: { color: Colors.neutralMedium, fontSize: 9, marginTop: 2 },
  inlineWarning: { marginTop: 12, color: '#9A6700', fontSize: 10, lineHeight: 15 },
  bottomActions: { marginTop: 21, gap: 9 },
  primaryButton: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: Colors.primary, borderRadius: 10 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, paddingHorizontal: 14 },
  secondaryButtonText: { color: Colors.dark, fontSize: 12, fontWeight: '800' },
});
