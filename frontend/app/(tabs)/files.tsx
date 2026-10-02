import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';

export default function ProjectFilesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');

  const files = [
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
  ];

  const filteredFiles = files.filter(
    (f) => activeFilter === 'All' || f.category === activeFilter
  );

  const handleUploadClick = () => {
    Alert.alert('Upload Deliverable', 'Select a file (.fig, .pdf, .zip) to upload for milestone review.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Back Link & Title */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Project Files</Text>

      {/* Dashed Dropzone Box (Matching Screenshot 3) */}
      <TouchableOpacity
        style={styles.uploadDropzone}
        onPress={handleUploadClick}
        activeOpacity={0.8}
      >
        <Text style={styles.uploadIcon}>📤</Text>
        <Text style={styles.uploadTitle}>Upload New File</Text>
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

      {/* Files List */}
      <View style={styles.fileList}>
        {filteredFiles.map((item) => (
          <View key={item.id} style={styles.fileCard}>
            <View style={styles.fileIconBox}>
              <Text style={{ fontSize: 20 }}>📄</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{item.name}</Text>
              <Text style={styles.fileMeta}>
                {item.type} • {item.size}
              </Text>
              <Text style={styles.fileDate}>{item.date}</Text>
            </View>

            <View style={styles.fileActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={{ fontSize: 16 }}>📥</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={{ fontSize: 16 }}>•••</Text>
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
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
  },
  backBtn: {
    marginBottom: Theme.spacing.xs,
  },
  backText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: Theme.spacing.md,
  },
  uploadDropzone: {
    height: 120,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  uploadIcon: {
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.neutralMedium,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  fileList: {
    gap: Theme.spacing.sm,
  },
  fileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: Colors.neutralMedium,
  },
  fileDate: {
    fontSize: 11,
    color: Colors.neutralLight,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
