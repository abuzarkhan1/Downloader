import { CommandTemplate } from '../types';

export const COMMAND_TEMPLATES_KEY = '@command_templates';

export const DEFAULT_COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    id: 'sponsorblock-remove',
    name: 'SponsorBlock Auto-Remove',
    description: 'Automatically skip sponsored segments, intros, and selfpromos.',
    flags: '--sponsorblock-remove all',
    isCustom: false,
  },
  {
    id: 'embed-subtitles',
    name: 'Embed English Subtitles',
    description: 'Download and embed English subtitles directly into the video file.',
    flags: '--write-sub --sub-lang en --embed-subs',
    isCustom: false,
  },
  {
    id: 'best-flac-audio',
    name: 'Lossless Audio Extraction (FLAC)',
    description: 'Extract raw audio stream and convert to high-fidelity FLAC.',
    flags: '--extract-audio --audio-format flac --audio-quality 0',
    isCustom: false,
  },
  {
    id: 'playlist-items-range',
    name: 'Download First 5 Playlist Items',
    description: 'Limit playlist extraction to the first 5 videos.',
    flags: '--playlist-start 1 --playlist-end 5',
    isCustom: false,
  },
];

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for environments where native module is unlinked/mocked
}

let memoryTemplates: CommandTemplate[] = [...DEFAULT_COMMAND_TEMPLATES];

/**
 * Retrieves all yt-dlp command templates.
 */
export const getCommandTemplates = async (): Promise<CommandTemplate[]> => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const json = await AsyncStorage.getItem(COMMAND_TEMPLATES_KEY);
      if (json) {
        memoryTemplates = JSON.parse(json);
        return memoryTemplates;
      }
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const json = window.localStorage.getItem(COMMAND_TEMPLATES_KEY);
      if (json) {
        memoryTemplates = JSON.parse(json);
        return memoryTemplates;
      }
    } catch (e) {}
  }

  return memoryTemplates;
};

/**
 * Adds or updates a command template.
 */
export const saveCommandTemplate = async (
  template: Omit<CommandTemplate, 'id'> & { id?: string }
): Promise<CommandTemplate> => {
  const current = await getCommandTemplates();
  const id = template.id || `custom_${Date.now()}`;
  const newTemplate: CommandTemplate = {
    id,
    name: template.name,
    description: template.description,
    flags: template.flags,
    isCustom: template.isCustom !== undefined ? template.isCustom : true,
  };

  const existingIdx = current.findIndex((t) => t.id === id);
  let updated: CommandTemplate[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newTemplate;
  } else {
    updated = [...current, newTemplate];
  }

  memoryTemplates = updated;
  await persistTemplates(updated);
  return newTemplate;
};

/**
 * Deletes a custom command template by ID.
 */
export const deleteCommandTemplate = async (id: string): Promise<boolean> => {
  const current = await getCommandTemplates();
  const updated = current.filter((t) => t.id !== id);
  const removed = updated.length < current.length;
  memoryTemplates = updated;
  await persistTemplates(updated);
  return removed;
};

/**
 * Resets templates to default pre-configured templates.
 */
export const resetCommandTemplates = async (): Promise<CommandTemplate[]> => {
  memoryTemplates = [...DEFAULT_COMMAND_TEMPLATES];
  await persistTemplates(memoryTemplates);
  return memoryTemplates;
};

const persistTemplates = async (templates: CommandTemplate[]): Promise<void> => {
  const json = JSON.stringify(templates);

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(COMMAND_TEMPLATES_KEY, json);
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(COMMAND_TEMPLATES_KEY, json);
    } catch (e) {}
  }
};
