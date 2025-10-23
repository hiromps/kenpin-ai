const SETTINGS_KEY = 'inspection_settings';

export interface InspectionSettings {
  similarityThreshold: number; // 0.0 ~ 1.0
}

const DEFAULT_SETTINGS: InspectionSettings = {
  similarityThreshold: 0.5, // デフォルト50%
};

export const getSettings = (): InspectionSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: InspectionSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const resetSettings = (): void => {
  localStorage.removeItem(SETTINGS_KEY);
};
