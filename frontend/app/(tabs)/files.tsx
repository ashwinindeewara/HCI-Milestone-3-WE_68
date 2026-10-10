import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { apiClient, FreelancerApiService, resolveMediaUrl, getCurrentUser, pickDocument } from '../../src/services/api';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  category: string;
  fileUrl?: string;
}

export default function ProjectFilesScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni'));

  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [filesList, setFilesList] = useState<FileItem[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `files_cache_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) return p;
        }
      } catch (e) {}
    }
    return isChathuni
      ? [
          {
            id: '1',
            name: 'homepage-mockup-v2.fig',
            type: 'Figma File',
            size: '2.4 MB',
            date: 'Uploaded Oct 05, 2024',
            category: 'Designs',
          },
          {
            id: '2',
            name: 'creative-brief-final.pdf',
            type: 'PDF Document',
            size: '450 KB',
            date: 'Uploaded Sep 12, 2024',
            category: 'Contracts',
          },
          {
            id: '3',
            name: 'brand-assets-package.zip',
            type: 'ZIP Archive',
            size: '18.2 MB',
            date: 'Uploaded Sep 10, 2024',
            category: 'Designs',
          },
        ]
      : [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await FreelancerApiService.getFiles();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const liveItems: FileItem[] = res.data.map((f: any) => {
          let cat = 'Designs';
          if (f.relatedEntityType === 'CONTRACT') cat = 'Contracts';
          else if (f.relatedEntityType === 'DISPUTE') cat = 'Contracts';
          
          let dateStr = 'Recent';
          if (f.createdAt) {
            try {
              dateStr = new Date(f.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            } catch (ignored) {}
          }

          return {
            id: f.id,
            name: f.originalFileName,
            type: f.mimeType || 'Document',
            size: f.fileSizeFormatted || '1 MB',
            date: `Uploaded ${dateStr}`,
            category: cat,
            fileUrl: f.fileUrl,
          };
        });

        // Merge with defaults for Chathuni only
        setFilesList((prev) => {
          let merged: FileItem[];
          if (isChathuni) {
            const names = new Set(liveItems.map((item) => item.name.toLowerCase()));
            const retainedDefaults = prev.filter((d) => !names.has(d.name.toLowerCase()));
            merged = [...liveItems, ...retainedDefaults];
          } else {
            merged = liveItems;
          }
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            try {
              const k = `files_cache_${currentUser?.email || currentUser?.fullName || 'default'}`;
              localStorage.setItem(k, JSON.stringify(merged));
            } catch (e) {}
          }
          return merged;
        });
      } else if (!isChathuni) {
        setFilesList([]);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            const k = `files_cache_${currentUser?.email || currentUser?.fullName || 'default'}`;
            localStorage.setItem(k, JSON.stringify([]));
          } catch (e) {}
        }
      }
    } catch (err) {
      if (!isChathuni) {
        setFilesList([]);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            const k = `files_cache_${currentUser?.email || currentUser?.fullName || 'default'}`;
            localStorage.setItem(k, JSON.stringify([]));
          } catch (e) {}
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadClick = async () => {
    try {
      const pickedDocs = await pickDocument({ multiple: true });
      if (pickedDocs.length === 0) return;

      setUploading(true);
      const currentUser = getCurrentUser();
      const uploader = currentUser?.fullName || 'Freelancer';
      const cat = activeFilter === 'Contracts' ? 'CONTRACT' : 'PROJECT';
      let successCount = 0;

      for (const doc of pickedDocs) {
        try {
          const res = await FreelancerApiService.uploadFile(doc, cat, 'PROJECT_FILES', uploader);
          if (res && res.id) {
            successCount++;
          }
        } catch (err: any) {
          console.warn('Single file upload error:', err);
        }
      }

      if (successCount > 0) {
        showToast(`✓ ${successCount} file(s) uploaded and saved to database!`);
        fetchFiles();
      } else {
        Alert.alert('Upload Failed', 'Could not upload selected file(s). Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'An error occurred during file selection.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenFile = (item: FileItem) => {
    if (item.fileUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(resolveMediaUrl(item.fileUrl), '_blank');
    } else {
      Alert.alert('File', `Selected: ${item.name}`);
    }
  };

  const filteredFiles = filesList.filter(
    (f) => activeFilter === 'All' || f.category === activeFilter
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Back Link & Title */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Project Files</Text>

      {/* Success Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Dashed Dropzone Box */}
      <TouchableOpacity
        style={styles.uploadDropzone}
        onPress={handleUploadClick}
        activeOpacity={0.8}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <Text style={styles.uploadIcon}>📤</Text>
        )}
        <Text style={styles.uploadTitle}>
          {uploading ? 'Uploading & saving to database...' : 'Upload New File'}
        </Text>
        <Text style={styles.uploadSubtitle}>Drag & drop or click to upload</Text>
      </TouchableOpacity>

      {/* Category Filter Chips */}
      <View style={styles.chipsRow}>
        {['All', 'Contracts', 'Designs'].map((cat) => {
          const isSelected = activeFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setActiveFilter(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading indicator */}
      {loading && filesList.length === 0 && (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      )}

      {/* Files List */}
      <View style={styles.fileList}>
        {filteredFiles.map((item) => (
          <View key={item.id} style={styles.fileCard}>
            <View style={styles.fileIconBox}>
              <Text style={{ fontSize: 20 }}>📄</Text>
            </View>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{item.name}</Text>
              <Text style={styles.fileMeta}>
                {item.type} • {item.size}
              </Text>
              <Text style={styles.fileDate}>{item.date}</Text>
            </View>

            <View style={styles.fileActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpenFile(item)}
                accessibilityLabel="Open File"
              >
                <Text style={{ fontSize: 16 }}>📥</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  toast: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 14,
  },
  toastText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  uploadDropzone: {
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  fileList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});
