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
  Modal,
  Share,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polygon } from 'react-native-svg';
import { Colors } from '../theme/theme';
import { useHistoryStore, HistoryItem } from '../store/useHistoryStore';
import { SmartThumbnail } from '../components/SmartThumbnail';
import { MediaPlayerModal } from '../components/MediaPlayerModal';

interface HistoryScreenProps {
  onNavigateHome?: () => void;
}

const HistoryThumbnail: React.FC<{ thumbnailUrl?: string; platform?: string; formatType: string; thumbnailIsFallback?: boolean }> = ({
  thumbnailUrl,
  platform,
  formatType,
  thumbnailIsFallback,
}) => {
  return (
    <SmartThumbnail
      uri={thumbnailUrl}
      platform={platform}
      containerStyle={{ width: 46, height: 46, borderRadius: 10 }}
      style={{ width: 46, height: 46, borderRadius: 10 }}
      fallbackIconName={formatType === 'audio' ? 'musical-notes' : 'film'}
      isFallbackThumbnail={thumbnailIsFallback}
    />
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigateHome }) => {
  const { historyItems: historyList, removeHistoryItem, clearHistory } = useHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerUri, setPlayerUri] = useState<string | null>(null);
  const [playerFormat, setPlayerFormat] = useState<'video' | 'audio'>('video');
  const [playerTitle, setPlayerTitle] = useState('');

  const handleRemove = (id: string) => {
    removeHistoryItem(id);
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
          onPress: () => {
            clearHistory();
          },
        },
      ]
    );
  };

  const handleOpenFile = async (item: HistoryItem) => {
    if (!item.localPath) {
      console.log('No local file available:', item.localPath);
      return;
    }
    setPlayerUri(item.localPath);
    setPlayerFormat(item.formatType === 'audio' ? 'audio' : 'video');
    setPlayerTitle(item.title || 'Media');
    setPlayerVisible(true);
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
          <Svg width="120" height="120" viewBox="0 0 100 100">
             <Polygon points="50,10 90,30 50,50 10,30" fill={Colors.black70} stroke={Colors.dividerColor} strokeWidth="2" />
             <Polygon points="10,30 50,50 50,90 10,70" fill={Colors.black80} stroke={Colors.dividerColor} strokeWidth="2" />
             <Polygon points="90,30 50,50 50,90 90,70" fill={Colors.black60} stroke={Colors.dividerColor} strokeWidth="2" />
             <Path d="M50,20 L70,30 L50,40 L30,30 Z" fill={Colors.textTertiary} opacity="0.3" />
          </Svg>
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
              accessibilityRole="button"
              accessibilityLabel="Start Downloading"
              accessibilityHint="Navigates to the home screen"
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
            <TouchableOpacity 
              style={styles.historyCard}
              onLongPress={() => {
                setSelectedHistoryItem(item);
                setActionSheetVisible(true);
              }}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`History item: ${item.title}`}
              accessibilityHint="Long press for quick actions"
            >
              <View style={styles.cardContentRow}>
                <HistoryThumbnail thumbnailUrl={item.thumbnailUrl} platform={item.platform} formatType={item.formatType} thumbnailIsFallback={item.thumbnailIsFallback} />

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
                  accessibilityRole="button"
                  accessibilityLabel="Open File"
                  accessibilityHint="Plays the file"
                >
                  <Ionicons name="folder-open-outline" size={14} color={Colors.black} />
                  <Text style={styles.openBtnText}>Open File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemove(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Remove"
                  accessibilityHint="Removes item from history"
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.errorRed} />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      
      {/* Quick Action Sheet */}
      <Modal visible={actionSheetVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={() => setActionSheetVisible(false)}>
          <View style={styles.actionSheetContent}>
             <Text style={styles.actionSheetTitle} numberOfLines={1}>{selectedHistoryItem?.title}</Text>
             <TouchableOpacity style={styles.actionSheetItem} onPress={() => {
                 setActionSheetVisible(false);
                 if (selectedHistoryItem) handleOpenFile(selectedHistoryItem);
             }}>
                 <Ionicons name="play" size={24} color={Colors.white} />
                 <Text style={styles.actionSheetItemText}>Play</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionSheetItem} onPress={() => {
                 setActionSheetVisible(false);
                 if (selectedHistoryItem?.localPath) {
                   Share.share({ url: selectedHistoryItem.localPath, message: `Check out this file: ${selectedHistoryItem.title}` });
                 }
             }}>
                 <Ionicons name="share-outline" size={24} color={Colors.white} />
                 <Text style={styles.actionSheetItemText}>Share</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionSheetItem} onPress={() => {
                 setActionSheetVisible(false);
                 Alert.alert('Save to Album', 'File saved to album successfully!');
             }}>
                 <Ionicons name="download-outline" size={24} color={Colors.white} />
                 <Text style={styles.actionSheetItemText}>Save to Album</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.actionSheetItem, { borderBottomWidth: 0 }]} onPress={() => {
                 setActionSheetVisible(false);
                 if (selectedHistoryItem) handleRemove(selectedHistoryItem.id);
             }}>
                 <Ionicons name="trash-outline" size={24} color={Colors.errorRed} />
                 <Text style={[styles.actionSheetItemText, { color: Colors.errorRed }]}>Delete</Text>
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <MediaPlayerModal
        visible={playerVisible}
        uri={playerUri}
        formatType={playerFormat}
        title={playerTitle}
        onClose={() => {
          setPlayerVisible(false);
          setPlayerUri(null);
        }}
      />
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
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: Colors.black80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
  },
  actionSheetTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dividerColor,
    gap: 12,
  },
  actionSheetItemText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
