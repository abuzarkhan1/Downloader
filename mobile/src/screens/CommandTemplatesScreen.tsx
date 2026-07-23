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
  Modal,
  Alert,
  Platform as RNPlatform,
} from 'react-native';
import { CommandTemplate } from '../types';
import {
  getCommandTemplates,
  saveCommandTemplate,
  deleteCommandTemplate,
  resetCommandTemplates,
} from '../services/commandTemplatesStorage';

interface CommandTemplatesScreenProps {
  onExecuteTemplate?: (flags: string) => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const CommandTemplatesScreen: React.FC<CommandTemplatesScreenProps> = ({
  onExecuteTemplate,
}) => {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [flagsInput, setFlagsInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadTemplates = async () => {
    const list = await getCommandTemplates();
    setTemplates(list);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setNameInput('');
    setDescInput('');
    setFlagsInput('');
    setFormError(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (template: CommandTemplate) => {
    setEditingId(template.id);
    setNameInput(template.name);
    setDescInput(template.description);
    setFlagsInput(template.flags);
    setFormError(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      setFormError('Please enter a template name.');
      return;
    }
    if (!flagsInput.trim()) {
      setFormError('Please enter custom yt-dlp flags.');
      return;
    }

    setFormError(null);
    await saveCommandTemplate({
      id: editingId || undefined,
      name: nameInput.trim(),
      description: descInput.trim() || 'Custom yt-dlp execution template',
      flags: flagsInput.trim(),
      isCustom: true,
    });

    setModalVisible(false);
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await deleteCommandTemplate(id);
    await loadTemplates();
  };

  const handleReset = async () => {
    await resetCommandTemplates();
    await loadTemplates();
  };

  return (
    <SafeAreaView style={styles.container} testID="command-templates-screen">
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Command Templates</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
          testID="add-template-btn"
        >
          <Text style={styles.addButtonText}>+ New Template</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTag}>ADVANCED YT-DLP CLI ENGINE</Text>
          <Text style={styles.introTitle}>Custom CLI Command Templates</Text>
          <Text style={styles.introSubtitle}>
            Configure custom yt-dlp arguments, format filters, SponsorBlock rules, and post-processing flags for specialized extraction.
          </Text>
        </View>

        {/* Templates List */}
        <View style={styles.templateList}>
          {templates.map((tpl) => (
            <View key={tpl.id} style={styles.templateCard} testID={`template-card-${tpl.id}`}>
              <View style={styles.templateHeaderRow}>
                <Text style={styles.templateName}>{tpl.name}</Text>
                {tpl.isCustom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>CUSTOM</Text>
                  </View>
                )}
              </View>

              <Text style={styles.templateDesc}>{tpl.description}</Text>

              {/* Flags Console Box */}
              <View style={styles.flagsConsoleBox}>
                <Text style={styles.flagsPrompt}>$ yt-dlp</Text>
                <Text style={styles.flagsText} selectable>
                  {tpl.flags}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {onExecuteTemplate && (
                  <TouchableOpacity
                    style={styles.executeButton}
                    onPress={() => onExecuteTemplate(tpl.flags)}
                    activeOpacity={0.85}
                    testID={`execute-template-${tpl.id}`}
                  >
                    <Text style={styles.executeButtonText}>Execute Template</Text>
                  </TouchableOpacity>
                )}

                {tpl.isCustom && (
                  <>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleOpenEditModal(tpl)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(tpl.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Reset Defaults Button */}
        <TouchableOpacity
          style={styles.resetDefaultsBtn}
          onPress={handleReset}
          activeOpacity={0.8}
          testID="reset-templates-btn"
        >
          <Text style={styles.resetDefaultsText}>Restore Preset Templates</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add / Edit Template Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Command Template' : 'New Command Template'}
            </Text>

            {formError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            <Text style={styles.inputFieldLabel}>TEMPLATE NAME</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. 4K HDR Extraction"
              placeholderTextColor="#8C8D82"
              value={nameInput}
              onChangeText={setNameInput}
              testID="template-name-input"
            />

            <Text style={styles.inputFieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Brief summary of what this template does..."
              placeholderTextColor="#8C8D82"
              value={descInput}
              onChangeText={setDescInput}
            />

            <Text style={styles.inputFieldLabel}>YT-DLP CLI FLAGS</Text>
            <TextInput
              style={[styles.modalTextInput, styles.monoInput]}
              placeholder="e.g. -f bestvideo+bestaudio --embed-thumbnail"
              placeholderTextColor="#8C8D82"
              value={flagsInput}
              onChangeText={setFlagsInput}
              autoCapitalize="none"
              autoCorrect={false}
              testID="template-flags-input"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
                testID="save-template-btn"
              >
                <Text style={styles.modalSaveText}>Save Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: LIME_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: DARK_BG,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  introCard: {
    backgroundColor: SURFACE_BG,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 20,
  },
  introTag: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1.2,
    marginBottom: 6,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_COLOR,
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 13,
    color: SUBTEXT_COLOR,
    lineHeight: 18,
  },
  templateList: {
    gap: 14,
    marginBottom: 24,
  },
  templateCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  templateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  customBadge: {
    backgroundColor: 'rgba(163, 212, 141, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(163, 212, 141, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    color: LIME_ACCENT,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  templateDesc: {
    fontSize: 13,
    color: SUBTEXT_COLOR,
    marginBottom: 12,
  },
  flagsConsoleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 14,
    gap: 8,
  },
  flagsPrompt: {
    color: LIME_ACCENT,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  flagsText: {
    flex: 1,
    color: TEXT_COLOR,
    fontSize: 12,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  executeButton: {
    backgroundColor: LIME_ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  executeButtonText: {
    color: DARK_BG,
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  resetDefaultsBtn: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetDefaultsText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalTextInput: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    height: 44,
    paddingHorizontal: 12,
    color: TEXT_COLOR,
    fontSize: 14,
  },
  monoInput: {
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: LIME_ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: DARK_BG,
    fontSize: 13,
    fontWeight: '700',
  },
});
