import * as Haptics from 'expo-haptics';

export const hapticLight = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Ignore error on unsupported devices
  }
};

export const hapticSelection = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Ignore error
  }
};

export const hapticSuccess = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Ignore error
  }
};

export const hapticError = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Ignore error
  }
};
