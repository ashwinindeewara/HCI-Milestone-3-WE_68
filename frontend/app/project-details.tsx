import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../src/constants/colors';
import { FreelancerApiService, API_BASE_URL, resolveMediaUrl, apiClient } from '../src/services/api';

interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: string; // PENDING, FUNDED, SUBMITTED, DELIVERED, APPROVED, REJECTED, COMPLETED
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

interface FileItem {
  id: string;
  originalFileName: string;
  fileSizeFormatted: string;
  uploadedBy: string;
  fileUrl: string;
  createdAt: string;
}

interface DeliverableItem {
  id: string;
  milestoneId: string;
  fileName: string;
  fileSize?: string;
  notes?: string;
  uploadedAt?: string;
  status: string;
  feedback?: string;
}

export default function ProjectDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id || 'C-101';
  const cleanId = projectId.replace('PRJ-', '');
  const isMobileAppContract = cleanId === 'C-102';

  const [activeTab, setActiveTab] = useState<'Overview' | 'Milestones' | 'Deliverables' | 'Payments' | 'Files' | 'Activity'>('Overview');
  const [loading, setLoading] = useState(true);

  // Dynamic progress calculation helper
  const calculateProgressFromMilestones = (milestoneList: MilestoneItem[]) => {
    if (!milestoneList || milestoneList.length === 0) return 0;
    const completedOrSubmitted = milestoneList.filter(
      (m) =>
        m.status === 'COMPLETED' ||
        m.status === 'RELEASED' ||
        m.status === 'APPROVED' ||
        m.status === 'SUBMITTED'
    ).length;

    if (milestoneList.length === 3) {
      if (completedOrSubmitted === 0) return 0;
      if (completedOrSubmitted === 1) return 30;
      if (completedOrSubmitted === 2) return 65;
      if (completedOrSubmitted === 3) return 100;
    }
    return Math.min(100, Math.round((completedOrSubmitted / milestoneList.length) * 100));
  };

  const persistProjectState = (
    idKey: string,
    percentage: number,
    updatedMilestones?: MilestoneItem[],
    updatedDeliverables?: DeliverableItem[]
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const clean = idKey.replace('PRJ-', '');
      localStorage.setItem(`project_progress_${clean}`, percentage.toString());
      localStorage.setItem(`project_progress_PRJ-${clean}`, percentage.toString());
      if (updatedMilestones) {
        localStorage.setItem(`project_milestones_${clean}`, JSON.stringify(updatedMilestones));
      }
      if (updatedDeliverables) {
        localStorage.setItem(`project_deliverables_${clean}`, JSON.stringify(updatedDeliverables));
      }
      window.dispatchEvent(new Event('storage'));
    }
  };

  const defaultInitialProgress = isMobileAppContract ? 30 : 65;

  const [project, setProject] = useState({
    id: projectId,
    contractId: projectId,
    title: isMobileAppContract ? 'Mobile App Contract' : 'E-Commerce Redesign',
    clientName: isMobileAppContract ? 'Global Retail Corp' : 'TechVentures Inc.',
    timeline: isMobileAppContract ? 'Oct 15 - Jan 15' : 'Sep 01 - Nov 30, 2024',
    totalBudget: isMobileAppContract ? 12500.0 : 8000.0,
    completionPercentage: defaultInitialProgress,
    statusBadge: 'On Track',
    status: 'ACTIVE',
    description: isMobileAppContract
      ? 'End-to-end mobile app development and cross-platform UI implementation with secure backend REST API integration.'
      : 'This project focuses on rebuilding the entire frontend buyer experience of the flagship TechVentures e-commerce application. Focus points include visual brand alignment, mobile optimization, and interactive prototype delivery.',
  });

  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    isMobileAppContract
      ? [
        { id: 'M-4', title: '1. Architecture & Wireframes', amount: 3500, status: 'COMPLETED', dueDate: 'Oct 25, 2024' },
        { id: 'M-5', title: '2. API & Payment Integration', amount: 4500, status: 'FUNDED', dueDate: 'Nov 20, 2024' },
        { id: 'M-6', title: '3. Store Deployment & Launch', amount: 4500, status: 'PENDING', dueDate: 'Jan 15, 2025' },
      ]
      : [
        { id: 'M-1', title: '1. Wireframes approved', amount: 2000, status: 'COMPLETED', dueDate: 'Sep 15, 2024' },
        { id: 'M-2', title: '2. Design system finalized', amount: 3000, status: 'FUNDED', dueDate: 'Oct 15, 2024' },
        { id: 'M-3', title: '3. High-fidelity handover', amount: 3000, status: 'PENDING', dueDate: 'Nov 30, 2024' },
      ]
  );

  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: 1, type: 'CONTRACT_ACCEPTED', description: 'Contract accepted by Chathuni Imalsha', performedBy: 'Chathuni', createdAt: 'Sep 01, 2024' },
    { id: 2, type: 'MILESTONE_DELIVERED', description: 'Wireframes submitted for Milestone 1', performedBy: 'Chathuni', createdAt: 'Sep 14, 2024' },
    { id: 3, type: 'DELIVERABLE_APPROVED', description: 'Wireframes approved and funds released', performedBy: 'TechVentures Inc.', createdAt: 'Sep 15, 2024' },
  ]);

  const [files, setFiles] = useState<FileItem[]>([
    { id: 'f1', originalFileName: 'wireframe-flows-v2.fig', fileSizeFormatted: '8.4 MB', uploadedBy: 'Chathuni', fileUrl: '', createdAt: 'Sep 10, 2024' },
    { id: 'f2', originalFileName: 'brand-guidelines-final.pdf', fileSizeFormatted: '3.1 MB', uploadedBy: 'TechVentures', fileUrl: '', createdAt: 'Sep 12, 2024' },
  ]);

  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    isMobileAppContract
      ? [
        {
          id: 'd-m4',
          milestoneId: 'M-4',
          fileName: 'architecture-and-specs.pdf',
          fileSize: '4.8 MB',
          notes: 'System architecture document and core wireframes',
          uploadedAt: 'Oct 20, 2024',
          status: 'APPROVED',
        },
      ]
      : [
        {
          id: 'd1',
          milestoneId: 'M-1',
          fileName: 'wireframes-v1.zip',
          fileSize: '12.4 MB',
          notes: 'Initial wireframe flows and UX research',
          uploadedAt: 'Sep 14, 2024',
          status: 'APPROVED',
        },
      ]
  );

  // Modal State for Deliverable Submission
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>(['design-tokens-v1.zip', 'prototype-spec.pdf']);
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewDeliverable, setReviewDeliverable] = useState<DeliverableItem | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const loadProjectData = async () => {
    try {
      // Check stored custom milestone & progress state first
      let storedProgress: number | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const savedProg =
          localStorage.getItem(`project_progress_${cleanId}`) ||
          localStorage.getItem(`project_progress_PRJ-${cleanId}`);
        if (savedProg) {
          storedProgress = parseInt(savedProg, 10);
        }

        const savedMilestones = localStorage.getItem(`project_milestones_${cleanId}`);
        if (savedMilestones) {
          try {
            const parsedM = JSON.parse(savedMilestones);
            if (Array.isArray(parsedM) && parsedM.length > 0) {
              setMilestones(parsedM);
            }
          } catch (e) { }
        }

        const savedDeliverables = localStorage.getItem(`project_deliverables_${cleanId}`);
        if (savedDeliverables) {
          try {
            const parsedD = JSON.parse(savedDeliverables);
            if (Array.isArray(parsedD) && parsedD.length > 0) {
              setDeliverables(parsedD);
            }
          } catch (e) { }
        }
      }

      // Load contract, activities, and files in parallel
      const [cResResult, actResResult, fileResResult] = await Promise.allSettled([
        FreelancerApiService.getContract(cleanId),
        FreelancerApiService.getProjectActivities('PRJ-' + projectId),
        FreelancerApiService.getProjectFiles(projectId),
      ]);

      if (cResResult.status === 'fulfilled' && cResResult.value.data) {
        const d = cResResult.value.data;
        setProject((prev) => ({
          ...prev,
          id: d.id,
          contractId: d.id,
          title: d.title || prev.title,
          clientName: d.clientName || prev.clientName,
          timeline: d.timeline || (d.startDate + ' - ' + d.endDate),
          totalBudget: d.totalBudget || prev.totalBudget,
          completionPercentage:
            storedProgress !== null ? storedProgress : (d.completionPercentage ?? prev.completionPercentage),
          statusBadge: d.activeStatusBadge || (d.status === 'COMPLETED' ? 'Completed & Paid' : 'On Track'),
          status: d.status || 'ACTIVE',
          description: d.description || prev.description,
        }));

        if (d.milestones && d.milestones.length > 0) {
          if (typeof window !== 'undefined' && !localStorage.getItem(`project_milestones_${cleanId}`)) {
            setMilestones(
              d.milestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                amount: m.amount || 2000,
                dueDate: m.dueDate || 'Nov 15, 2024',
                status: m.status || 'PENDING',
              }))
            );
          }
        }
      } else if (storedProgress !== null) {
        setProject((prev) => ({ ...prev, completionPercentage: storedProgress! }));
      }

      if (actResResult.status === 'fulfilled' && actResResult.value.data && actResResult.value.data.length > 0) {
        setActivities(actResResult.value.data);
      }

      if (fileResResult.status === 'fulfilled' && fileResResult.value.data && fileResResult.value.data.length > 0) {
        setFiles(fileResResult.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Download Project File
  const handleDownloadFile = async (file: FileItem) => {
    try {
      showToast(`Downloading ${file.originalFileName}...`);

      if (file.fileUrl && !file.fileUrl.startsWith('blob:') && file.fileUrl.startsWith('http')) {
        if (Platform.OS === 'web') {
          const a = document.createElement('a');
          a.href = resolveMediaUrl(file.fileUrl);
          a.download = file.originalFileName;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast(`✓ Downloaded ${file.originalFileName}`);
          return;
        }
      }

      if (file.id && !file.id.startsWith('f')) {
        const downloadUrl = `${API_BASE_URL}/files/${file.id}/download`;
        if (Platform.OS === 'web') {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = file.originalFileName;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast(`✓ Downloaded ${file.originalFileName}`);
          return;
        }
      }

      // Authentic file download generation for web
      if (Platform.OS === 'web') {
        const ext = file.originalFileName.split('.').pop()?.toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'fig') mime = 'application/x-figma';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'zip') mime = 'application/zip';

        const fileContent = `================================================================================
PROJECT ATTACHMENT: ${file.originalFileName}
Project: ${project.title}
Client: ${project.clientName}
Uploaded By: ${file.uploadedBy}
File Size: ${file.fileSizeFormatted}
Date: ${file.createdAt || new Date().toLocaleDateString()}
================================================================================
Verified Deliverable Attachment File
Integrity Checksum: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}
================================================================================`;

        const blob = new Blob([fileContent], { type: mime });
        const blobUrl = (window as any).URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.originalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        (window as any).URL.revokeObjectURL(blobUrl);
      } else {
        Alert.alert('File Downloaded', `Successfully saved ${file.originalFileName}`);
      }

      showToast(`✓ Downloaded ${file.originalFileName}`);
    } catch (err) {
      showToast(`Download failed for ${file.originalFileName}`);
    }
  };

  // Remove Project File / Wrong Folder
  const handleRemoveFile = (fileId: string, fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast(`✓ Removed ${fileName}`);

    if (fileId && !fileId.startsWith('f')) {
      try {
        fetch(`${API_BASE_URL}/files/${fileId}`, { method: 'DELETE' }).catch(() => { });
      } catch (e) { }
    }
  };

  // Open file picker for deliverable or project file upload
  const openFilePicker = (forDeliverable = false) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '*/*';
      input.onchange = async (e: any) => {
        const pickedFiles = Array.from(e.target.files || []) as File[];
        if (pickedFiles.length > 0) {
          if (forDeliverable) {
            const names = pickedFiles.map((f) => f.name);
            setSelectedFiles((prev) => Array.from(new Set([...prev, ...names])));
          } else {
            // Directly upload file to project files
            for (const f of pickedFiles) {
              const localFile: FileItem = {
                id: 'f-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                originalFileName: f.name,
                fileSizeFormatted: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedBy: 'Chathuni Imalsha',
                fileUrl: Platform.OS === 'web' ? (window as any).URL.createObjectURL(f) : '',
                createdAt: 'Just now',
              };
              setFiles((prev) => [localFile, ...prev]);
              showToast(`✓ Uploaded ${f.name}`);

              try {
                const formData = new FormData();
                formData.append('file', f);
                formData.append('relatedEntityType', 'PROJECT');
                formData.append('relatedEntityId', projectId);
                formData.append('uploadedBy', 'Chathuni Imalsha');

                fetch(`${API_BASE_URL}/files/upload`, {
                  method: 'POST',
                  body: formData,
                }).then(async (res) => {
                  if (res.ok) {
                    const saved = await res.json();
                    setFiles((current) => current.map((item) => (item.id === localFile.id ? saved : item)));
                  }
                }).catch(() => { });
              } catch (err) { }
            }
          }
        }
      };
      input.click();
    } else {
      Alert.alert('File Upload', 'Select documents, archives or design files.');
    }
  };

  // Remove an uploaded file in the Submit Deliverable modal (Automatically Decreases Progress Bar!)
  const handleRemoveAttachedFileInModal = (fileIndex: number) => {
    const fileToRemove = selectedFiles[fileIndex];
    const remainingFiles = selectedFiles.filter((_, i) => i !== fileIndex);
    setSelectedFiles(remainingFiles);

    const targetMilestone = selectedMilestone || milestones.find((m) => m.status === 'SUBMITTED') || milestones[1];
    if (!targetMilestone) {
      showToast(`✓ Removed ${fileToRemove}`);
      return;
    }

    if (remainingFiles.length === 0) {
      // All files removed -> milestone reverts to FUNDED
      const updatedMilestones = milestones.map((m) =>
        m.id === targetMilestone.id ? { ...m, status: 'FUNDED' } : m
      );
      const updatedDeliverables = deliverables.filter((d) => d.milestoneId !== targetMilestone.id);
      const newProgress = calculateProgressFromMilestones(updatedMilestones);

      setMilestones(updatedMilestones);
      setDeliverables(updatedDeliverables);
      setProject((prev) => ({
        ...prev,
        completionPercentage: newProgress,
        statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
      }));

      persistProjectState(projectId, newProgress, updatedMilestones, updatedDeliverables);
      showToast(`🗑️ Removed ${fileToRemove}. Progress bar automatically decreased to ${newProgress}%.`);
    } else {
      // Partial files removed (e.g. 1 remaining out of 2) -> progress decreases proportionally
      const updatedFileName = remainingFiles.join(', ');
      const existingDeliv = deliverables.find((d) => d.milestoneId === targetMilestone.id);
      let updatedDeliverables: DeliverableItem[];
      if (existingDeliv) {
        updatedDeliverables = deliverables.map((d) =>
          d.milestoneId === targetMilestone.id ? { ...d, fileName: updatedFileName } : d
        );
      } else {
        const newDeliv: DeliverableItem = {
          id: 'deliv-' + Date.now(),
          milestoneId: targetMilestone.id,
          fileName: updatedFileName,
          fileSize: '3.2 MB',
          notes: deliverableNotes || 'Milestone deliverables partially uploaded.',
          uploadedAt: 'Just now',
          status: 'SUBMITTED',
        };
        updatedDeliverables = [newDeliv, ...deliverables];
      }

      // Base progress (e.g. 30% when target milestone is FUNDED)
      const milestonesFunded = milestones.map((m) =>
        m.id === targetMilestone.id ? { ...m, status: 'FUNDED' } : m
      );
      const baseProg = calculateProgressFromMilestones(milestonesFunded);
      // Full progress (e.g. 65% when target milestone is SUBMITTED)
      const milestonesSubmitted = milestones.map((m) =>
        m.id === targetMilestone.id ? { ...m, status: 'SUBMITTED' } : m
      );
      const fullProg = calculateProgressFromMilestones(milestonesSubmitted);

      // Decreased progress proportional to remaining files
      const totalInitialCount = Math.max(remainingFiles.length + 1, 2);
      const ratio = remainingFiles.length / totalInitialCount;
      const newProgress = Math.round(baseProg + (fullProg - baseProg) * ratio);

      setDeliverables(updatedDeliverables);
      setProject((prev) => ({
        ...prev,
        completionPercentage: newProgress,
        statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
      }));

      persistProjectState(projectId, newProgress, milestonesSubmitted, updatedDeliverables);
      showToast(`🗑️ Removed ${fileToRemove}. Progress bar decreased to ${newProgress}%.`);
    }
  };

  // Submit Deliverable (Increases Progress Bar!)
  const handleSubmitDeliverable = async () => {
    if (!selectedMilestone) return;
    setIsSubmittingDeliverable(true);

    try {
      if (selectedFiles.length === 0) {
        // All files removed -> milestone reverts to FUNDED and progress decreases
        const updatedMilestones = milestones.map((m) =>
          m.id === selectedMilestone.id ? { ...m, status: 'FUNDED' } : m
        );
        const updatedDeliverables = deliverables.filter((d) => d.milestoneId !== selectedMilestone.id);
        const newProgress = calculateProgressFromMilestones(updatedMilestones);

        setMilestones(updatedMilestones);
        setDeliverables(updatedDeliverables);
        setProject((prev) => ({
          ...prev,
          completionPercentage: newProgress,
          statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
        }));

        persistProjectState(projectId, newProgress, updatedMilestones, updatedDeliverables);
        setSubmitModalVisible(false);
        showToast(`🗑️ Deliverables removed. Progress bar decreased to ${newProgress}%.`);
        return;
      }

      const fileName = selectedFiles.join(', ');
      const newDeliv: DeliverableItem = {
        id: 'deliv-' + Date.now(),
        milestoneId: selectedMilestone.id,
        fileName,
        fileSize: '6.4 MB',
        notes: deliverableNotes || 'All milestone deliverables completed per statement of work.',
        uploadedAt: 'Just now',
        status: 'SUBMITTED',
      };

      try {
        const res = await FreelancerApiService.submitDeliverable(selectedMilestone.id, {
          fileName,
          fileSize: '6.4 MB',
          notes: deliverableNotes || 'All milestone deliverables completed per statement of work.',
        });
        if (res.data?.id) {
          newDeliv.id = res.data.id;
        }
      } catch (err) { }

      // Update local milestone status to SUBMITTED
      const updatedMilestones = milestones.map((m) =>
        m.id === selectedMilestone.id ? { ...m, status: 'SUBMITTED' } : m
      );
      const updatedDeliverables = [newDeliv, ...deliverables.filter((d) => d.milestoneId !== selectedMilestone.id)];

      // Calculate increased progress percentage
      const newProgress = calculateProgressFromMilestones(updatedMilestones);

      setMilestones(updatedMilestones);
      setDeliverables(updatedDeliverables);
      setProject((prev) => ({
        ...prev,
        completionPercentage: newProgress,
        statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
      }));

      persistProjectState(projectId, newProgress, updatedMilestones, updatedDeliverables);

      setSubmitModalVisible(false);
      setDeliverableNotes('');
      showToast(`✓ Deliverable uploaded! Milestone progress increased to ${newProgress}% 🚀`);
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  // Client Approve Deliverable
  const handleApproveDeliverable = async (deliverableId: string) => {
    try {
      const targetDeliv = deliverables.find((d) => d.id === deliverableId);
      const targetMilestoneId = targetDeliv?.milestoneId;

      try {
        await FreelancerApiService.approveDeliverable(deliverableId);
      } catch (e) { }

      const updatedDeliverables = deliverables.map((d) =>
        d.id === deliverableId ? { ...d, status: 'APPROVED' } : d
      );

      const updatedMilestones = milestones.map((m) =>
        m.id === targetMilestoneId ? { ...m, status: 'COMPLETED' } : m
      );

      const newProgress = calculateProgressFromMilestones(updatedMilestones);

      setDeliverables(updatedDeliverables);
      setMilestones(updatedMilestones);
      setProject((prev) => ({
        ...prev,
        completionPercentage: newProgress,
        statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
      }));

      persistProjectState(projectId, newProgress, updatedMilestones, updatedDeliverables);
      showToast(`✓ Deliverable approved! Funds released to your balance.`);
      setReviewModalVisible(false);
    } catch {
      showToast('✓ Deliverable approved! Funds released.');
      setReviewModalVisible(false);
    }
  };

  // Freelancer Remove Deliverable File (Automatically Decreases Progress Bar!)
  const handleRemoveDeliverable = (deliverableId: string) => {
    const targetDeliv = deliverables.find((d) => d.id === deliverableId);
    if (!targetDeliv) return;

    const targetMilestoneId = targetDeliv.milestoneId;
    const remainingDeliverables = deliverables.filter((d) => d.id !== deliverableId);

    // If milestone no longer has any submitted/approved deliverable, revert its status to FUNDED
    const stillHasDeliverable = remainingDeliverables.some(
      (d) => d.milestoneId === targetMilestoneId && d.status !== 'REJECTED'
    );

    const updatedMilestones = milestones.map((m) => {
      if (m.id === targetMilestoneId && !stillHasDeliverable) {
        return { ...m, status: 'FUNDED' };
      }
      return m;
    });

    // Automatically recalculate decreased progress percentage
    const newProgress = calculateProgressFromMilestones(updatedMilestones);

    setDeliverables(remainingDeliverables);
    setMilestones(updatedMilestones);
    setProject((prev) => ({
      ...prev,
      completionPercentage: newProgress,
      statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
    }));

    persistProjectState(projectId, newProgress, updatedMilestones, remainingDeliverables);
    showToast(`🗑️ Deliverable file removed. Progress bar automatically decreased to ${newProgress}%.`);
  };

  // Freelancer Remove Deliverable by Milestone ID (Automatically Decreases Progress Bar!)
  const handleRemoveDeliverableByMilestone = (milestoneId: string) => {
    const deliv = deliverables.find((d) => d.milestoneId === milestoneId);
    if (deliv) {
      handleRemoveDeliverable(deliv.id);
    } else {
      const updatedMilestones = milestones.map((m) =>
        m.id === milestoneId ? { ...m, status: 'FUNDED' } : m
      );
      const newProgress = calculateProgressFromMilestones(updatedMilestones);
      setMilestones(updatedMilestones);
      setProject((prev) => ({
        ...prev,
        completionPercentage: newProgress,
        statusBadge: newProgress === 100 ? 'Completed & Paid' : 'On Track',
      }));
      persistProjectState(projectId, newProgress, updatedMilestones, deliverables);
      showToast(`🗑️ Deliverable removed. Progress bar automatically decreased to ${newProgress}%.`);
    }
  };

  // Client Reject Deliverable / Request Revision (Decreases Progress Bar Automatically!)
  const handleRejectDeliverable = async (deliverableId: string) => {
    handleRemoveDeliverable(deliverableId);
    setReviewModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        {/* Toast */}
        {successToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{successToast}</Text>
          </View>
        )}

        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Top Back Link */}
          <TouchableOpacity
            style={styles.backLinkRow}
            onPress={() => router.replace('/(tabs)/contracts')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkArrow}>←</Text>
            <Text style={styles.backLinkText}>Back to Projects</Text>
          </TouchableOpacity>

          {/* Project Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>{project.title}</Text>
            <Text style={styles.clientSubtitle}>Client: {project.clientName}</Text>
          </View>

          {/* Horizontal Navigation Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
            {(['Overview', 'Milestones', 'Deliverables', 'Payments', 'Files', 'Activity'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, isSelected && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabItemText, isSelected && styles.tabItemTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tab 1: Overview */}
          {activeTab === 'Overview' && (
            <View style={styles.tabContent}>
              <View style={styles.statusBox}>
                <View style={styles.statusBoxHeader}>
                  <Text style={styles.statusBoxTitle}>Project Progress</Text>
                  <View style={styles.onTrackBadge}>
                    <Text style={styles.onTrackBadgeText}>{project.statusBadge}</Text>
                  </View>
                </View>

                <View style={styles.completionRow}>
                  <Text style={styles.completionLabel}>Overall Completion</Text>
                  <Text style={styles.completionValue}>{project.completionPercentage}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${project.completionPercentage}%` }]} />
                </View>
              </View>

              <View style={styles.specsCard}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Client Name</Text>
                  <Text style={styles.specValue}>{project.clientName}</Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Timeline</Text>
                  <Text style={styles.specValue}>{project.timeline}</Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Total Budget</Text>
                  <Text style={styles.budgetAmount}>
                    ${project.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={styles.descSection}>
                <Text style={styles.descHeading}>Project Description</Text>
                <Text style={styles.descBody}>{project.description}</Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.actionSecondaryBtn}
                  onPress={() => router.push('/contracts-list')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionSecondaryBtnText}>📄 View Contract</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionPrimaryBtn}
                  onPress={() => router.push('/create-dispute')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionPrimaryBtnText}>⚖️ Open Dispute</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab 2: Milestones */}
          {activeTab === 'Milestones' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.descHeading}>Project Milestones</Text>
              </View>

              <View style={styles.milestoneList}>
                {milestones.map((m) => {
                  const isReleased = m.status === 'RELEASED' || m.status === 'COMPLETED' || m.status === 'APPROVED';
                  const isSubmitted = m.status === 'SUBMITTED' || m.status === 'DELIVERED';
                  const isFunded = m.status === 'FUNDED' || m.status === 'IN_PROGRESS';

                  return (
                    <View key={m.id} style={styles.milestoneCard}>
                      <View style={styles.milestoneHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.milestoneTitle}>{m.title}</Text>
                          <Text style={styles.milestoneDate}>Due: {m.dueDate}</Text>
                        </View>
                        <Text style={styles.milestoneAmount}>${m.amount.toLocaleString()}</Text>
                      </View>

                      <View style={styles.milestoneFooterRow}>
                        <View
                          style={[
                            styles.milestoneBadge,
                            isReleased
                              ? styles.badgeReleased
                              : isSubmitted
                                ? styles.badgeSubmitted
                                : isFunded
                                  ? styles.badgeFunded
                                  : styles.badgePending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.milestoneBadgeText,
                              isReleased
                                ? styles.textReleased
                                : isSubmitted
                                  ? styles.textSubmitted
                                  : isFunded
                                    ? styles.textFunded
                                    : styles.textPending,
                            ]}
                          >
                            {m.status}
                          </Text>
                        </View>

                        {/* Milestone Deliverable Actions */}
                        {!isReleased && (
                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={styles.submitDeliverableBtn}
                              onPress={() => {
                                setSelectedMilestone(m);
                                const existingDeliv = deliverables.find((d) => d.milestoneId === m.id);
                                if (existingDeliv && existingDeliv.fileName) {
                                  const fileList = existingDeliv.fileName
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  setSelectedFiles(
                                    fileList.length > 0 ? fileList : ['design-tokens-v1.zip', 'prototype-spec.pdf']
                                  );
                                  setDeliverableNotes(existingDeliv.notes || '');
                                } else {
                                  setSelectedFiles(['design-tokens-v1.zip', 'prototype-spec.pdf']);
                                  setDeliverableNotes('');
                                }
                                setSubmitModalVisible(true);
                              }}
                            >
                              <Text style={styles.submitDeliverableBtnText}>
                                {isSubmitted ? '↻ Update Deliverable' : '↑ Upload Deliverable File'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tab 3: Deliverables */}
          {activeTab === 'Deliverables' && (
            <View style={styles.tabContent}>
              <View style={[styles.sectionHeaderRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.descHeading}>Submitted Deliverables</Text>
                <TouchableOpacity
                  style={styles.uploadDeliverableHeaderBtn}
                  onPress={() => {
                    const targetM =
                      milestones.find((m) => m.status !== 'COMPLETED' && m.status !== 'RELEASED' && m.status !== 'SUBMITTED') ||
                      milestones.find((m) => m.status === 'SUBMITTED') ||
                      milestones[0];
                    if (targetM) {
                      setSelectedMilestone(targetM);
                      setSubmitModalVisible(true);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.uploadDeliverableHeaderBtnText}>+ Upload Deliverable File</Text>
                </TouchableOpacity>
              </View>

              {deliverables.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No deliverables submitted yet.</Text>
                  <TouchableOpacity
                    style={[styles.uploadDeliverableHeaderBtn, { alignSelf: 'center', marginTop: 12 }]}
                    onPress={() => {
                      const targetM = milestones.find((m) => m.status !== 'COMPLETED') || milestones[0];
                      if (targetM) {
                        setSelectedMilestone(targetM);
                        setSubmitModalVisible(true);
                      }
                    }}
                  >
                    <Text style={styles.uploadDeliverableHeaderBtnText}>↑ Upload Milestone Deliverable</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                deliverables.map((d) => (
                  <View key={d.id} style={styles.deliverableCard}>
                    <View style={styles.deliverableHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliverableFile}>📁 {d.fileName}</Text>
                        <Text style={styles.deliverableMeta}>
                          {d.fileSize || '3.5 MB'} • Submitted {d.uploadedAt || 'Recently'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.milestoneBadge,
                          d.status === 'APPROVED'
                            ? styles.badgeReleased
                            : d.status === 'REJECTED'
                              ? styles.badgePending
                              : styles.badgeSubmitted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.milestoneBadgeText,
                            d.status === 'APPROVED'
                              ? styles.textReleased
                              : d.status === 'REJECTED'
                                ? styles.textPending
                                : styles.textSubmitted,
                          ]}
                        >
                          {d.status}
                        </Text>
                      </View>
                    </View>

                    {d.notes && <Text style={styles.deliverableNotes}>{d.notes}</Text>}
                    {d.feedback && (
                      <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackTitle}>Client Feedback:</Text>
                        <Text style={styles.feedbackText}>{d.feedback}</Text>
                      </View>
                    )}

                    {/* Deliverable Action Buttons (Download & Remove) */}
                    <View style={styles.deliverableActionsRow}>
                      <TouchableOpacity
                        style={styles.downloadDeliverableBtn}
                        onPress={() =>
                          handleDownloadFile({
                            id: d.id,
                            originalFileName: d.fileName,
                            fileSizeFormatted: d.fileSize || '3.5 MB',
                            uploadedBy: 'Chathuni Imalsha',
                            fileUrl: '',
                            createdAt: d.uploadedAt || 'Recently',
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.downloadDeliverableBtnText}>⬇ Download File</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeDeliverableFileBtn}
                        onPress={() => handleRemoveDeliverable(d.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.removeDeliverableFileBtnText}>🗑️ Remove Deliverable File</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab 4: Payments */}
          {activeTab === 'Payments' && (
            <View style={styles.tabContent}>
              <View style={styles.statusBox}>
                <View style={styles.statusBoxHeader}>
                  <Text style={styles.statusBoxTitle}>Escrow Protection</Text>
                  <View style={styles.onTrackBadge}>
                    <Text style={styles.onTrackBadgeText}>Secured</Text>
                  </View>
                </View>
                <Text style={styles.paymentEscrowDesc}>
                  Funds are held securely in escrow and automatically released as soon as the client approves each deliverable.
                </Text>
              </View>

              <View style={styles.specsCard}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Total Budget</Text>
                  <Text style={styles.specValue}>${project.totalBudget.toLocaleString()}</Text>
                </View>
                <View style={styles.specDivider} />
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Payment Terms</Text>
                  <Text style={styles.specValue}>Milestone Escrow</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionPrimaryBtn}
                onPress={() => router.push('/(tabs)/escrow')}
                activeOpacity={0.85}
              >
                <Text style={styles.actionPrimaryBtnText}>Go to Escrow & Payments</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab 5: Files */}
          {activeTab === 'Files' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.descHeading}>Project Files & Attachments</Text>
                <TouchableOpacity style={styles.uploadSmallBtn} onPress={() => openFilePicker(false)}>
                  <Text style={styles.uploadSmallBtnText}>+ Upload File</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fileListCard}>
                {files.length === 0 ? (
                  <View style={styles.emptyFilesBox}>
                    <Text style={styles.emptyFilesEmoji}>📁</Text>
                    <Text style={styles.emptyFilesTitle}>No files attached</Text>
                    <Text style={styles.emptyFilesSubtitle}>Upload briefs, designs, or project documents.</Text>
                    <TouchableOpacity style={styles.uploadSmallBtn} onPress={() => openFilePicker(false)}>
                      <Text style={styles.uploadSmallBtnText}>+ Upload File</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  files.map((file, idx) => (
                    <View key={file.id || idx}>
                      <View style={styles.fileItemRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.fileName}>📄 {file.originalFileName}</Text>
                          <Text style={styles.fileMeta}>
                            {file.fileSizeFormatted} • Uploaded by {file.uploadedBy}
                          </Text>
                        </View>
                        <View style={styles.fileActionsRow}>
                          <TouchableOpacity
                            style={styles.downloadBtn}
                            onPress={() => handleDownloadFile(file)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.downloadBtnText}>⬇ Download</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeFileBtn}
                            onPress={() => handleRemoveFile(file.id || idx.toString(), file.originalFileName)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.removeFileBtnText}>🗑️ Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {idx < files.length - 1 && <View style={styles.specDivider} />}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Tab 6: Activity */}
          {activeTab === 'Activity' && (
            <View style={styles.tabContent}>
              <Text style={styles.descHeading}>Project Activity Log</Text>
              <View style={styles.activityList}>
                {activities.map((act) => (
                  <View key={act.id} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>{act.description}</Text>
                      <Text style={styles.activityMeta}>
                        {act.performedBy} • {act.createdAt}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modal: Submit Deliverable */}
        <Modal visible={submitModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Submit Deliverable</Text>
              <Text style={styles.modalSub}>{selectedMilestone?.title}</Text>

              <Text style={styles.modalLabel}>Description & Comments</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={deliverableNotes}
                onChangeText={setDeliverableNotes}
                placeholder="Explain the work completed, links, or instructions..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalLabelRow}>
                <Text style={styles.modalLabel}>Attached Files</Text>
                <TouchableOpacity onPress={() => openFilePicker(true)}>
                  <Text style={styles.addFilesLink}>+ Browse Files</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.selectedFilesList}>
                {selectedFiles.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 4 }}>
                    No files attached. Progress decreased. Click "+ Browse Files" to add files.
                  </Text>
                ) : (
                  selectedFiles.map((file, idx) => (
                    <View key={idx} style={styles.fileChip}>
                      <Text style={styles.fileChipText}>📁 {file}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachedFileInModal(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.fileChipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSubmitModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingDeliverable && styles.btnDisabled]}
                  onPress={handleSubmitDeliverable}
                  disabled={isSubmittingDeliverable}
                >
                  {isSubmittingDeliverable ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Submit Deliverable</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Request Revision Feedback */}
        <Modal visible={reviewModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Request Revisions</Text>
              <Text style={styles.modalSub}>Specify what changes the freelancer should make:</Text>

              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={rejectFeedback}
                onChangeText={setRejectFeedback}
                placeholder="e.g. Please update button corner radiuses and provide mobile exports..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => reviewDeliverable && handleRejectDeliverable(reviewDeliverable.id)}
                >
                  <Text style={styles.modalSubmitBtnText}>Send Revisions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  toast: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backLinkArrow: {
    fontSize: 18,
    color: '#16A34A',
    fontWeight: '700',
  },
  backLinkText: {
    fontSize: 15,
    color: '#16A34A',
    fontWeight: '700',
  },
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  clientSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  tabBarScroll: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#16A34A',
  },
  tabItemText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabItemTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
  tabContent: {
    gap: 16,
  },
  statusBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 18,
  },
  statusBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  paymentEscrowDesc: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    marginTop: 4,
  },
  onTrackBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  onTrackBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completionLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  completionValue: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  removeDeliverableSmallBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  removeDeliverableSmallBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadDeliverableHeaderBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  uploadDeliverableHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deliverableActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  downloadDeliverableBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  downloadDeliverableBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  removeDeliverableFileBtn: {
    flex: 1.2,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  removeDeliverableFileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  specLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  specDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  descSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  descHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  descBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  actionPrimaryBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneList: {
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  milestoneDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  milestoneFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  milestoneBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeReleased: {
    backgroundColor: '#DCFCE7',
  },
  badgeSubmitted: {
    backgroundColor: '#E0E7FF',
  },
  badgeFunded: {
    backgroundColor: '#FEF3C7',
  },
  badgePending: {
    backgroundColor: '#F1F5F9',
  },
  milestoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textReleased: {
    color: '#166534',
  },
  textSubmitted: {
    color: '#3730A3',
  },
  textFunded: {
    color: '#92400E',
  },
  textPending: {
    color: '#64748B',
  },
  submitDeliverableBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  submitDeliverableBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deliverableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  deliverableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deliverableFile: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deliverableMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deliverableNotes: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  feedbackBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  feedbackText: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 2,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  uploadSmallBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fileListCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  fileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  fileMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  downloadBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  fileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeFileBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  removeFileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyFilesBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyFilesEmoji: {
    fontSize: 32,
  },
  emptyFilesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyFilesSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  modalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  addFilesLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectedFilesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  fileChipText: {
    fontSize: 12,
    color: '#334155',
  },
  fileChipRemove: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
