import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform as RNPlatform,
  Linking,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';
import { SmartThumbnail } from '../components/SmartThumbnail';

export interface ActiveDownloadItem {
  id: string;
  title: string;
  platform: string;
  quality: string;
  formatType: 'video' | 'audio' | 'subtitle';
  progressPercent: number;
  status: 'processing' | 'queued' | 'ready' | 'failed';
  localPath?: string;
  fileSizeMb?: number;
  thumbnailUrl?: string;
}

interface DownloadsScreenProps {
  activeDownloads?: ActiveDownloadItem[];
  onCancelDownload?: (id: string) => void;
  onClearCompleted?: () => void;
  onNavigateHome?: () => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({
  activeDownloads: propActiveDownloads = [],
  onCancelDownload,
  onClearCompleted,
  onNavigateHome,
}) => {
  const [downloads, setDownloads] = useState<ActiveDownloadItem[]>(propActiveDownloads);

  useEffect(() => {
    setDownloads(propActiveDownloads);
  }, [propActiveDownloads]);

  const handleOpenFile = async (item: ActiveDownloadItem) => {
    if (!item.localPath) return;
    try {
      if (RNPlatform.OS === 'android') {
        const mimeType = item.formatType === 'audio' ? 'audio/mpeg' : 'video/mp4';
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: item.localPath,
          type: mimeType,
          flags: 1,
        });
      } else {
        await Linking.openURL(item.localPath);
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleRemove = (id: string) => {
    if (onCancelDownload) onCancelDownload(id);
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const activeCount = downloads.filter(d => d.status === 'processing' || d.status === 'queued').length;
  const completedCount = downloads.filter(d => d.status === 'ready').length;

  return (
    <SafeAreaView style={styles.container} testID="downloads-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeftGroup}>
          <Ionicons name="arrow-down-circle" size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>Downloads</Text>
          {activeCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{activeCount} active</Text>
            </View>
          )}
        </View>
        {completedCount > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setDownloads(prev => prev.filter(d => d.status !== 'ready'))}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear Completed</Text>
          </TouchableOpacity>
        )}
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-download-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Active Downloads</Text>
          <Text style={styles.emptySubtitle}>
            Your queued and completed downloads will show up here.
          </Text>
          {onNavigateHome && (
            <TouchableOpacity
              style={styles.goHomeBtn}
              onPress={onNavigateHome}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={16} color={Colors.black} style={{ marginRight: 6 }} />
              <Text style={styles.goHomeBtnText}>Analyze & Download Link</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => {
            const isDownloading = item.status === 'processing' || item.status === 'queued';
            const isReady = item.status === 'ready';

            return (
              <View style={styles.downloadCard}>
                <View style={styles.cardTopRow}>
                  <SmartThumbnail
                    uri={item.thumbnailUrl}
                    platform={item.platform}
                    containerStyle={{ width: 44, height: 44, borderRadius: 10 }}
                    style={{ width: 44, height: 44, borderRadius: 10 }}
                    fallbackIconName={item.formatType === 'audio' ? 'musical-notes-outline' : 'videocam-outline'}
                  />
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <View style={styles.platformBadge}>
                        <Text style={styles.platformBadgeText}>{item.platform.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.qualityText}>{item.quality}</Text>
                      {item.fileSizeMb && (
                        <>
                          <Text style={styles.metaDot}>·</Text>
                          <Text style={styles.sizeText}>{item.fileSizeMb} MB</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  {isReady && (
                    <TouchableOpacity
                      style={styles.openBtn}
                      onPress={() => handleOpenFile(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play" size={16} color={Colors.black} />
                      <Text style={styles.openBtnText}>Open</Text>
                    </TouchableOpacity>
                  )}

                  {isDownloading && (
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => handleRemove(item.id)}
                    >
                      <Ionicons name="close-circle-outline" size={22} color={Colors.errorRed} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress Bar for Active Downloads */}
                {isDownloading && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={styles.progressStatusText}>Downloading…</Text>
                      <Text style={styles.progressPercentText}>{item.progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.max(5, item.progressPercent)}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dividerColor,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: Colors.black60,
    borderWidth: 0.5,
    borderColor: Colors.dividerLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.black80,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  goHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  goHomeBtnText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 14,
  },
  downloadCard: {
    backgroundColor: Colors.black80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    padding: 14,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.black70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformBadge: {
    backgroundColor: Colors.black70,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  metaDot: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  qualityText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sizeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  openBtnText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '700',
  },
  iconActionBtn: {
    padding: 4,
  },
  progressSection: {
    gap: 6,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatusText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.black70,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
});
