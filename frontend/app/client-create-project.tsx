import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../src/constants/colors';
import Theme from '../src/constants/theme';
import { getSavedUserData } from '../src/services/authService';
import apiClient from '../src/services/api';

interface ProjectDeliverable {
  id: string;
  title: string;
  description: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  amount: string;
  description: string;
}

const today = new Date().toISOString().slice(0, 10);

const formatDueDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const isValidDueDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return parsedDate.getUTCFullYear() === Number(year)
    && parsedDate.getUTCMonth() === Number(month) - 1
    && parsedDate.getUTCDate() === Number(day);
};

export default function CreateProjectScreen() {
  const router = useRouter();
  const { talentId } = useLocalSearchParams<{ talentId?: string }>();
  const currentUser = getSavedUserData();

  const [talent, setTalent] = useState<{
    id: string;
    name: string;
    email?: string;
    role: string;
  } | null>(null);
  const [talentLoading, setTalentLoading] = useState(true);
  const [talentError, setTalentError] = useState('');
  const [step, setStep] = useState(1);
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [minimumRequirements, setMinimumRequirements] = useState('');
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([
    { id: 'D-1', title: '', description: '' },
  ]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    { id: 'M-1', title: '', dueDate: '', amount: '', description: '' },
  ]);
  const [paymentStrategy, setPaymentStrategy] = useState<'MILESTONE_ESCROW'>('MILESTONE_ESCROW');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBudget = useMemo(
    () => milestones.reduce((sum, milestone) => sum + (Number(milestone.amount) || 0), 0),
    [milestones]
  );

  // Load the selected freelancer from the backend using the ID passed from Find Talent.
  // API: GET /api/freelancer/profile?id=5
  useEffect(() => {
    const loadSelectedTalent = async () => {
      const selectedId = Array.isArray(talentId) ? talentId[0] : talentId;

      if (!selectedId) {
        console.error('No freelancer ID was provided to Create Project.');
        setTalentError('No freelancer was selected.');
        setTalentLoading(false);
        return;
      }

      setTalentLoading(true);
      setTalentError('');

      try {
        console.log('========== SELECTED FREELANCER ==========', selectedId);
        console.log('Loading freelancer by ID...');

        const response = await apiClient.get('/freelancer/profile', {
          params: { id: Number(selectedId) },
          timeout: 10000,
        });

        console.log('Freelancer API status:', response.status);
        console.log('Freelancer API response:', response.data);

        const rawProfile = response.data?.profile ?? response.data;

        if (!rawProfile) {
          throw new Error(`Freelancer not found for id: ${selectedId}`);
        }

        const mappedTalent = {
          id: String(
            rawProfile.id ??
            rawProfile.userId ??
            rawProfile.user?.id ??
            selectedId
          ),
          name:
            rawProfile.user?.fullName ??
            rawProfile.fullName ??
            rawProfile.name ??
            'Unknown Freelancer',
          email:
            rawProfile.user?.email ??
            rawProfile.email ??
            rawProfile.userEmail ??
            '',
          role:
            rawProfile.professionalTitle ??
            rawProfile.title ??
            rawProfile.role ??
            'Freelancer',
        };

        console.log('Mapped selected freelancer:', mappedTalent);
        setTalent(mappedTalent);
      } catch (error: any) {
        console.error('Failed to load selected freelancer:', error);
        console.error('Error message:', error?.message);
        console.error('Error URL:', error?.config?.url);
        console.error('Error params:', error?.config?.params);
        console.error('Backend response:', error?.response?.data);

        setTalent(null);
        setTalentError(
          error?.response?.data?.message ??
          error?.message ??
          'Unable to load the selected freelancer.'
        );
      } finally {
        setTalentLoading(false);
      }
    };

    loadSelectedTalent();
  }, [talentId]);

  const updateDeliverable = (id: string, field: 'title' | 'description', value: string) => {
    setDeliverables((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateMilestone = (id: string, field: keyof Omit<ProjectMilestone, 'id'>, value: string) => {
    setMilestones((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const validateStep = () => {
    if (step === 1 && (!projectTitle.trim() || !description.trim())) {
      Alert.alert('Project details required', 'Add a project title and description to continue.');
      return false;
    }
    if (step === 2 && (!scopeOfWork.trim() || !minimumRequirements.trim())) {
      Alert.alert('Scope details required', 'Describe the work and minimum requirements.');
      return false;
    }
    if (step === 3 && (deliverables.length === 0 || deliverables.some((item) => !item.title.trim()))) {
      Alert.alert('Deliverables required', 'Give each deliverable a title before continuing.');
      return false;
    }
    if (step === 4) {
      if (milestones.length === 0 || milestones.some((item) =>
        !item.title.trim() || !isValidDueDate(item.dueDate) || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0
      )) {
        Alert.alert('Check milestones', 'Each milestone needs a title, valid date, and amount above zero. Dates accept YYYYMMDD or YYYY-MM-DD.');
        return false;
      }
    }
    return true;
  };

  const submitProject = async (status: 'DRAFT' = 'DRAFT', openPreview = false) => {
    if (!talent) {
      Alert.alert('Freelancer required', 'Choose a freelancer before creating this project.', [
        { text: 'Find talent', onPress: () => router.replace('/client-find-talent') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    const projectId = `C-${Date.now()}`;
    const endDate = milestones
      .map((milestone) => milestone.dueDate)
      .sort()
      .at(-1) || today;
    setIsSubmitting(true);
    try {
      const formattedKeyDeliverables = deliverables
        .map((item) => (item.description ? `${item.title.trim()}: ${item.description.trim()}` : item.title.trim()))
        .filter(Boolean)
        .join('\n');

      console.log('Submitting contract to backend /contracts for freelancer:', talent.name);
      await apiClient.post('/contracts', {
        id: projectId,
        title: projectTitle.trim(),
        description: description.trim(),
        scopeOfWork: scopeOfWork.trim(),
        minimumRequirements: minimumRequirements.trim(),
        keyDeliverables: formattedKeyDeliverables,
        paymentStrategy,
        paymentTerms: paymentStrategy,
        clientName: currentUser?.company || currentUser?.fullName || currentUser?.email || 'Client',
        freelancerName: talent.name,
        freelancerEmail: talent.email || '',
        totalBudget,
        status,
        startDate: today,
        endDate,
        milestones: milestones.map((milestone, index) => ({
          id: `${projectId}-M${index + 1}`,
          contractId: projectId,
          title: milestone.title.trim(),
          description: milestone.description.trim() || milestone.title.trim(),
          amount: Number(milestone.amount),
          dueDate: milestone.dueDate,
          status: 'PENDING',
          deliverables: [],
        })),
      });

      if (openPreview) {
          console.log("dd");
        router.replace({
          pathname: '/client-create-contract',
          params: { id: projectId },
        });
      } else {
          console.log("ss");
        Alert.alert('Draft saved', 'Your project draft was saved to My Projects.', [
          { text: 'View projects', onPress: () => router.replace('/client-contracts') },
        ]);
      }
    } catch (error: any) {
      console.error('Failed to create project contract:', error);
      console.error('Response data:', error.response?.data);
      Alert.alert(
        'Could not create project',
        error.response?.data?.message || 'The backend could not save this project. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (validateStep()) setStep((current) => Math.min(6, current + 1));
  };

  const addDeliverable = () => {
    setDeliverables((items) => [...items, { id: `D-${Date.now()}`, title: '', description: '' }]);
  };

  const addMilestone = () => {
    setMilestones((items) => [...items, {
      id: `M-${Date.now()}`,
      title: '',
      dueDate: '',
      amount: '',
      description: '',
    }]);
  };

  return (
      <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => step > 1 ? setStep(step - 1) : router.replace('/client-find-talent')}
                style={styles.backButton}
              >
                <Text style={styles.backGlyph}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Project</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>STEP {step} OF 6</Text>
              <Text style={styles.progressPercent}>{Math.round((step / 6) * 100)}% Complete</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
            </View>

            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Project Details</Text>
                <Text style={styles.stepSubtitle}>Tell us about what you want to build.</Text>
                {talentLoading ? (
                  <View style={styles.selectedTalentLoading}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.selectedTalent}>Loading selected freelancer...</Text>
                  </View>
                ) : talent ? (
                  <Text style={styles.selectedTalent}>For {talent.name} · {talent.role}</Text>
                ) : (
                  <Text style={styles.selectedTalentError}>
                    {talentError || 'No freelancer selected.'}
                  </Text>
                )}
                <Text style={styles.fieldLabel}>Project title</Text>
                <TextInput
                  style={styles.input}
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="e.g. E-Commerce Platform Rebrand"
                  placeholderTextColor={Colors.neutralLight}
                  maxLength={100}
                />
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the product, problem, and outcome you need..."
                  placeholderTextColor={Colors.neutralLight}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Scope & Requirements</Text>
                <Text style={styles.stepSubtitle}>Define boundaries and expectations for the project.</Text>
                <Text style={styles.fieldLabel}>Scope of work</Text>
                <TextInput
                  style={styles.textArea}
                  value={scopeOfWork}
                  onChangeText={setScopeOfWork}
                  placeholder="Describe the work included in this project..."
                  placeholderTextColor={Colors.neutralLight}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.fieldLabel}>Minimum requirements</Text>
                <TextInput
                  style={styles.textArea}
                  value={minimumRequirements}
                  onChangeText={setMinimumRequirements}
                  placeholder="Experience, tools, communication, or technical requirements..."
                  placeholderTextColor={Colors.neutralLight}
                  multiline
                  textAlignVertical="top"
                  maxLength={1500}
                />
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Key Deliverables</Text>
                <Text style={styles.stepSubtitle}>List the work and assets expected from the freelancer.</Text>
                {deliverables.map((item, index) => (
                  <View key={item.id} style={styles.editorRow}>
                    <View style={styles.editorHeader}>
                      <Text style={styles.editorTitle}>Deliverable {index + 1}</Text>
                      {deliverables.length > 1 && (
                        <TouchableOpacity onPress={() => setDeliverables((items) => items.filter((value) => value.id !== item.id))}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={item.title}
                      onChangeText={(value) => updateDeliverable(item.id, 'title', value)}
                      placeholder="Deliverable title"
                      placeholderTextColor={Colors.neutralLight}
                    />
                    <TextInput
                      style={styles.compactTextArea}
                      value={item.description}
                      onChangeText={(value) => updateDeliverable(item.id, 'description', value)}
                      placeholder="Description (optional)"
                      placeholderTextColor={Colors.neutralLight}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addDeliverable}>
                  <Text style={styles.addButtonText}>+  Add another deliverable</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>Files can be attached after the contract is created.</Text>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Project Milestones</Text>
                <Text style={styles.stepSubtitle}>Split the budget into deliverables with due dates.</Text>
                {milestones.map((item, index) => (
                  <View key={item.id} style={styles.editorRow}>
                    <View style={styles.editorHeader}>
                      <Text style={styles.editorTitle}>Milestone {index + 1}</Text>
                      <Text style={styles.milestoneAmountPreview}>${(Number(item.amount) || 0).toLocaleString()}</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={item.title}
                      onChangeText={(value) => updateMilestone(item.id, 'title', value)}
                      placeholder="e.g. Research & wireframes"
                      placeholderTextColor={Colors.neutralLight}
                    />
                    <View style={styles.milestoneFieldsRow}>
                      <View style={styles.milestoneField}>
                        <Text style={styles.smallFieldLabel}>Amount (USD)</Text>
                        <TextInput
                          style={styles.input}
                          value={item.amount}
                          onChangeText={(value) => updateMilestone(item.id, 'amount', value.replace(/[^0-9.]/g, ''))}
                          placeholder="3200"
                          keyboardType="decimal-pad"
                          placeholderTextColor={Colors.neutralLight}
                        />
                      </View>
                      <View style={styles.milestoneField}>
                        <Text style={styles.smallFieldLabel}>Due date</Text>
                        <TextInput
                          style={styles.input}
                          value={item.dueDate}
                          onChangeText={(value) => updateMilestone(item.id, 'dueDate', formatDueDateInput(value))}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={Colors.neutralLight}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                    <TextInput
                      style={styles.compactTextArea}
                      value={item.description}
                      onChangeText={(value) => updateMilestone(item.id, 'description', value)}
                      placeholder="Milestone details (optional)"
                      placeholderTextColor={Colors.neutralLight}
                      multiline
                      textAlignVertical="top"
                    />
                    {milestones.length > 1 && (
                      <TouchableOpacity onPress={() => setMilestones((items) => items.filter((value) => value.id !== item.id))}>
                        <Text style={styles.removeText}>Remove milestone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addMilestone}>
                  <Text style={styles.addButtonText}>+  Add another milestone</Text>
                </TouchableOpacity>
                <View style={styles.budgetTotalRow}>
                  <Text style={styles.budgetTotalLabel}>Total allocated budget</Text>
                  <Text style={styles.budgetTotalValue}>${totalBudget.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Payment Terms</Text>
                <Text style={styles.stepSubtitle}>Set the escrow approach and review your allocated budget.</Text>
                <Text style={styles.fieldLabel}>Total allocated budget (USD)</Text>
                <View style={styles.readOnlyBudget}>
                  <Text style={styles.readOnlyBudgetText}>${totalBudget.toLocaleString()}</Text>
                </View>
                <Text style={styles.fieldLabel}>Escrow strategy</Text>
                <TouchableOpacity
                  style={[styles.strategyCard, styles.strategyCardSelected]}
                  onPress={() => setPaymentStrategy('MILESTONE_ESCROW')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: paymentStrategy === 'MILESTONE_ESCROW' }}
                >
                  <View style={[styles.strategyRadio, styles.strategyRadioSelected]}>
                    <View style={styles.strategyRadioInner} />
                  </View>
                  <View style={styles.strategyTextBlock}>
                    <Text style={styles.strategyTitle}>Milestone-based escrow</Text>
                    <Text style={styles.strategyDescription}>Funds are released as each milestone is approved.</Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.strategyCard, styles.strategyCardDisabled]}>
                  <View style={styles.strategyRadio} />
                  <View style={styles.strategyTextBlock}>
                    <Text style={styles.strategyTitle}>Hourly / retainer</Text>
                    <Text style={styles.strategyDescription}>Not supported by the current escrow service.</Text>
                  </View>
                </View>
                <View style={styles.distributionBlock}>
                  <Text style={styles.fieldLabel}>Current escrow distribution</Text>
                  {milestones.map((milestone, index) => (
                    <View style={styles.distributionRow} key={milestone.id}>
                      <Text style={styles.distributionName} numberOfLines={1}>M{index + 1}: {milestone.title}</Text>
                      <Text style={styles.distributionAmount}>
                        ${Number(milestone.amount).toLocaleString()} ({totalBudget > 0
                          ? Math.round(Number(milestone.amount) / totalBudget * 100)
                          : 0}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {step === 6 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Review Project Details</Text>
                <Text style={styles.stepSubtitle}>Confirm everything before sending the contract.</Text>
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewEyebrow}>PROJECT TITLE</Text>
                  <Text style={styles.reviewTitle}>{projectTitle}</Text>
                  <Text style={styles.reviewEyebrow}>DESCRIPTION PREVIEW</Text>
                  <Text numberOfLines={3} style={styles.reviewDescription}>{description}</Text>
                  <Text style={styles.reviewEyebrow}>FREELANCER</Text>
                  <Text style={styles.reviewBody}>{talent?.name || 'Not selected'}</Text>
                  <Text style={styles.reviewEyebrow}>BUDGET & STRATEGY</Text>
                  <Text style={styles.reviewBudget}>${totalBudget.toLocaleString()} · Milestone-based escrow</Text>
                  <View style={styles.reviewDivider} />
                  <Text style={styles.reviewEyebrow}>CONFIRMED MILESTONES ({milestones.length})</Text>
                  {milestones.map((milestone, index) => (
                    <View style={styles.reviewMilestoneRow} key={milestone.id}>
                      <View style={styles.reviewMilestoneCopy}>
                        <Text style={styles.reviewMilestoneTitle}>M{index + 1}: {milestone.title}</Text>
                        <Text style={styles.reviewMilestoneDate}>Due {milestone.dueDate}</Text>
                      </View>
                      <Text style={styles.reviewMilestoneAmount}>${Number(milestone.amount).toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={styles.reviewDivider} />
                  <Text style={styles.reviewEyebrow}>KEY DELIVERABLES ({deliverables.length})</Text>
                  {deliverables.map((item) => (
                    <Text key={item.id} style={styles.deliverableReview}>•  {item.title}</Text>
                  ))}
                </View>
              </View>
            )}

            {step < 6 ? (
              <View style={styles.navigationRow}>
                {step > 1 ? (
                  <TouchableOpacity style={styles.backStepButton} onPress={() => setStep((current) => current - 1)}>
                    <Text style={styles.backStepText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.navigationSpacer} />
                )}
                <TouchableOpacity style={styles.nextButton} onPress={goNext}>
                  <Text style={styles.nextButtonText}>Next step</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.finalActions}>
                <TouchableOpacity
                  style={[styles.createProjectButton, isSubmitting && styles.buttonDisabled]}
                  onPress={() => submitProject('DRAFT', true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.nextButtonText}>Create Project</Text>}
                </TouchableOpacity>
                <View style={styles.finalSecondaryRow}>
                  <TouchableOpacity
                    style={styles.finalSecondaryButton}
                    onPress={() => setStep(5)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.backStepText}>Back to Step 5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveDraftButton}
                    onPress={() => submitProject('DRAFT')}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.saveDraftText}>Save Draft</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        <View style={styles.clientTabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-dashboard')}>
              <Text style={[styles.tabIcon, styles.tabIconActive]}>🏠</Text>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-contracts')}>
              <Text style={styles.tabIcon}>📁</Text>
              <Text style={styles.tabLabel}>Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-find-talent')}>
              <Text style={styles.tabIcon}>🔍</Text>
              <Text style={styles.tabLabel}>Find Talent</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-reports')}>
              <Text style={styles.tabIcon}>💳</Text>
              <Text style={styles.tabLabel}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/client-profile')}>
              <Text style={styles.tabIcon}>👤</Text>
              <Text style={styles.tabLabel}>Profile</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { flex: 1 },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 80,
  },
  content: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },
  backGlyph: {
    color: Colors.dark,
    fontSize: 31,
    lineHeight: 34,
  },
  headerTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  progressLabel: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  progressPercent: {
    color: Colors.neutralMedium,
    fontSize: 11,
  },
  progressTrack: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Theme.spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  stepContent: {
    gap: Theme.spacing.sm,
  },
  stepTitle: {
    color: Colors.dark,
    fontSize: 21,
    fontWeight: '800',
  },
  stepSubtitle: {
    color: Colors.neutralMedium,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Theme.spacing.sm,
  },
  selectedTalent: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  selectedTalentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  selectedTalentError: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  fieldLabel: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '700',
    marginTop: Theme.spacing.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Theme.spacing.md,
    color: Colors.dark,
    fontSize: 14,
  },
  textArea: {
    minHeight: 128,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    padding: Theme.spacing.md,
    color: Colors.dark,
    fontSize: 14,
    lineHeight: 20,
  },
  compactTextArea: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    padding: Theme.spacing.sm,
    color: Colors.dark,
    fontSize: 13,
    lineHeight: 18,
  },
  editorRow: {
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editorTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '800',
  },
  removeText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    paddingVertical: Theme.spacing.xs,
  },
  addButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.xs,
  },
  addButtonText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    color: Colors.neutralLight,
    fontSize: 11,
    lineHeight: 16,
  },
  milestoneAmountPreview: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  milestoneFieldsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  milestoneField: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  smallFieldLabel: {
    color: Colors.neutralMedium,
    fontSize: 11,
    fontWeight: '700',
  },
  budgetTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Theme.spacing.sm,
  },
  budgetTotalLabel: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '700',
  },
  budgetTotalValue: {
    color: Colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  readOnlyBudget: {
    minHeight: 50,
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
  },
  readOnlyBudgetText: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '700',
  },
  strategyCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
  },
  strategyCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  strategyCardDisabled: {
    opacity: 0.55,
  },
  strategyRadio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyRadioSelected: {
    borderColor: Colors.primary,
  },
  strategyRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  strategyTextBlock: {
    flex: 1,
  },
  strategyTitle: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '700',
  },
  strategyDescription: {
    color: Colors.neutralMedium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  distributionBlock: {
    marginTop: Theme.spacing.sm,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  distributionName: {
    flex: 1,
    color: Colors.neutralMedium,
    fontSize: 12,
  },
  distributionAmount: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  reviewEyebrow: {
    color: Colors.neutralLight,
    fontSize: 10,
    fontWeight: '800',
    marginTop: Theme.spacing.sm,
  },
  reviewTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewBody: {
    color: Colors.dark,
    fontSize: 13,
  },
  reviewDescription: {
    color: Colors.neutralMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  reviewBudget: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.xs,
  },
  reviewMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  reviewMilestoneCopy: {
    flex: 1,
  },
  reviewMilestoneTitle: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewMilestoneDate: {
    color: Colors.neutralLight,
    fontSize: 11,
    marginTop: 2,
  },
  reviewMilestoneAmount: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  deliverableReview: {
    color: Colors.neutralMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
  },
  finalActions: {
    marginTop: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  createProjectButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  finalSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  finalSecondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  saveDraftButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  navigationSpacer: {
    flex: 1,
  },
  backStepButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  backStepText: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  nextButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clientTabBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 18, opacity: 0.6 },
  tabIconActive: { opacity: 1, transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.neutralMedium, marginTop: 2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
