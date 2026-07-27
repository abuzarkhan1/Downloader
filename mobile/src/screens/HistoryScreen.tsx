import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Platform as RNPlatform,
  Linking,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';
import { getHistoryItems, removeHistoryItem, clearAllHistory, HistoryItem } from '../services/historyStorage';
import { SmartThumbnail } from '../components/SmartThumbnail';

interface HistoryScreenProps {
  onNavigateHome?: () => void;
}

const HistoryThumbnail: React.FC<{ thumbnailUrl?: string; platform?: string; formatType: string }> = ({
  thumbnailUrl,
  platform,
  formatType,
}) => {
  return (
    <SmartThumbnail
      uri={thumbnailUrl}
      platform={platform}
      containerStyle={{ width: 46, height: 46, borderRadius: 10 }}
      style={{ width: 46, height: 46, borderRadius: 10 }}
      fallbackIconName={formatType === 'audio' ? 'musical-notes' : 'film'}
    />
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateHome }) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const items = await getHistoryItems();
    setHistoryList(items);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRemove = async (id: string) => {
    await removeHistoryItem(id);
    setHistoryList(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to remove all items from download history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            setHistoryList([]);
          },
        },
      ]
    );
  };

  const handleOpenFile = async (item: HistoryItem) => {
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

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoStr;
    }
  };

  const filteredList = historyList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q) ||
      item.quality.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container} testID="history-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeftGroup}>
          <Ionicons name="time" size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>History</Text>
        </View>
        {historyList.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input Bar */}
      {historyList.length > 0 && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={16} color={Colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search history by title or platform..."
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No Matching History' : 'No History Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No results matching "${searchQuery}"`
              : 'Media downloads you complete will automatically be saved here.'}
          </Text>
          {onNavigateHome && !searchQuery && (
            <TouchableOpacity
              style={styles.goHomeBtn}
              onPress={onNavigateHome}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={16} color={Colors.black} style={{ marginRight: 6 }} />
              <Text style={styles.goHomeBtnText}>Start Downloading</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.cardContentRow}>
                <HistoryThumbnail thumbnailUrl={item.thumbnailUrl} platform={item.platform} formatType={item.formatType} />

                <View style={styles.cardTextCol}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.metaRow}>
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

                  <Text style={styles.dateText}>{formatDate(item.downloadedAt)}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => handleOpenFile(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="folder-open-outline" size={14} color={Colors.black} />
                  <Text style={styles.openBtnText}>Open File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemove(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.errorRed} />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    color: Colors.errorRed,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black80,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100, // Safe padding for iPhone bottom nav bar
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
  historyCard: {
    backgroundColor: Colors.black80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    padding: 14,
    gap: 10,
  },
  cardContentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.black70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  thumbnailImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.black70,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  metaRow: {
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
  dateText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  cardDivider: {
    height: 0.5,
    backgroundColor: Colors.dividerColor,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  openBtnText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: {
    color: Colors.errorRed,
    fontSize: 12,
    fontWeight: '500',
  },
});
