import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  Platform as RNPlatform,
  Linking,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { DownloadHistoryItem } from '../types';
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  filterHistoryItems,
} from '../services/historyStorage';
import { PlatformBadge } from '../components/PlatformBadge';

interface HistoryScreenProps {
  initialItems?: DownloadHistoryItem[];
  onRedownload?: (item: DownloadHistoryItem) => void;
  onBackToHome?: () => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  initialItems,
  onRedownload,
  onBackToHome,
}) => {
  const [historyItems, setHistoryItems] = useState<DownloadHistoryItem[]>(initialItems || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Processing' | 'Failed'>('All');
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const items = await getHistory();
    setHistoryItems(items);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    getHistory().then((items) => {
      if (isMounted && items && items.length > 0) {
        setHistoryItems(items);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    await loadHistory();
  };

  const handleClearAll = async () => {
    await clearHistory();
    await loadHistory();
  };

  const handleOpenFile = async (item: DownloadHistoryItem) => {
    const fileUri = item.filePath;
    if (!fileUri) {
      Alert.alert('File Unavailable', 'No local file path recorded for this item.');
      return;
    }

    try {
      if (RNPlatform.OS === 'android') {
        const mimeType = item.format === 'audio' ? 'audio/*' : 'video/*';
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: fileUri,
          type: mimeType,
          flags: 1,
        });
      } else {
        const supported = await Linking.canOpenURL(fileUri);
        if (supported) {
          await Linking.openURL(fileUri);
        } else {
          Alert.alert('Media Location', `File location:\n${fileUri}`);
        }
      }
    } catch (err) {
      Alert.alert('Media Location', `File location:\n${fileUri}`);
    }
  };

  const filteredItems = filterHistoryItems(historyItems, searchQuery, statusFilter);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="history-screen">
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Navigation Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Download History</Text>
        {historyItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
            testID="history-clear-btn"
          >
            <Text style={styles.clearAllText}>Clear History</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>SEARCH DOWNLOADS</Text>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search title, quality, uploader..."
              placeholderTextColor="#8C8D82"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              testID="history-search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearQueryBtn}
                testID="history-search-clear"
              >
                <Text style={styles.clearQueryText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterRow}>
          {(['All', 'Completed', 'Processing', 'Failed'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter)}
                activeOpacity={0.8}
                testID={`history-filter-${filter.toLowerCase()}`}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Download Items List */}
        {filteredItems.length > 0 ? (
          <View style={styles.itemsList}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.itemCard} testID={`history-item-${item.id}`}>
                <View style={styles.itemHeader}>
                  <View style={styles.thumbnailContainer}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailFallback}>
                        <Text style={styles.fallbackIcon}>🎬</Text>
                      </View>
                    )}
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatBadgeText}>{item.format.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                    {item.platform && (
                      <View style={styles.badgeRow}>
                        <PlatformBadge platform={item.platform} size="small" />
                        {item.uploader && (
                          <Text style={styles.uploaderText} numberOfLines={1}>
                            • {item.uploader}
                          </Text>
                        )}
                      </View>
                    )}
                    <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                  </View>
                </View>

                {/* Status & Quality Row */}
                <View style={styles.statusMetaRow}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'completed' && styles.statusCompleted,
                      item.status === 'processing' && styles.statusProcessing,
                      item.status === 'failed' && styles.statusFailed,
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {item.status === 'completed' && '✓ Completed'}
                      {item.status === 'processing' && '⏳ Processing'}
                      {item.status === 'failed' && '✕ Failed'}
                    </Text>
                  </View>
                  <Text style={styles.qualityMeta}>{item.quality}</Text>
                </View>

                {item.errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText} numberOfLines={2}>
                      {item.errorMessage}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.itemActionRow}>
                  {item.status === 'completed' && item.filePath && (
                    <TouchableOpacity
                      style={styles.actionOpenBtn}
                      onPress={() => handleOpenFile(item)}
                      activeOpacity={0.8}
                      testID={`history-open-${item.id}`}
                    >
                      <Text style={styles.actionOpenText}>Open File</Text>
                    </TouchableOpacity>
                  )}

                  {onRedownload && (
                    <TouchableOpacity
                      style={styles.actionRedownloadBtn}
                      onPress={() => onRedownload(item)}
                      activeOpacity={0.8}
                      testID={`history-redownload-${item.id}`}
                    >
                      <Text style={styles.actionRedownloadText}>Re-download</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.8}
                    testID={`history-delete-${item.id}`}
                  >
                    <Text style={styles.actionDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptySubtitle} testID="history-empty-text">
              {searchQuery || statusFilter !== 'All'
                ? 'No downloads match your current filter criteria.'
                : 'Your downloaded videos and extracted audio files will appear here.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: DARK_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: -0.3,
  },
  clearAllBtn: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearAllText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  searchCard: {
    backgroundColor: SURFACE_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1.2,
    marginBottom: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: TEXT_COLOR,
    fontSize: 14,
  },
  clearQueryBtn: {
    padding: 6,
  },
  clearQueryText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: LIME_ACCENT,
    borderColor: LIME_ACCENT,
  },
  filterChipText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: DARK_BG,
    fontWeight: '700',
  },
  itemsList: {
    gap: 14,
  },
  itemCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  thumbnailContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: DARK_BG,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_BG,
  },
  fallbackIcon: {
    fontSize: 24,
  },
  formatBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(27, 28, 24, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: {
    color: LIME_ACCENT,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemTitle: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploaderText: {
    color: SUBTEXT_COLOR,
    fontSize: 12,
    flex: 1,
  },
  dateText: {
    color: '#8C8D82',
    fontSize: 11,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: 'rgba(163, 212, 141, 0.15)',
  },
  statusProcessing: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: LIME_ACCENT,
  },
  qualityMeta: {
    color: SUBTEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  itemActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionOpenBtn: {
    backgroundColor: LIME_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionOpenText: {
    color: DARK_BG,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRedownloadBtn: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionRedownloadText: {
    color: TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  actionDeleteBtn: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionDeleteText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    color: TEXT_COLOR,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: SUBTEXT_COLOR,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
