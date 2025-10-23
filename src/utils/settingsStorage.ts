const SETTINGS_KEY = 'inspection_settings';

export interface InspectionSettings {
  thresholds: {
    黒点: number;
    キズ: number;
    フラッシュ: number;
  };
}

const DEFAULT_SETTINGS: InspectionSettings = {
  thresholds: {
    黒点: 0.5,      // デフォルト50%
    キズ: 0.5,      // デフォルト50%
    フラッシュ: 0.65, // デフォルト65%（厳格な一致を要求）
  },
};

export const getSettings = (): InspectionSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored);

    // 新しい設定構造にマイグレーション
    const settings: InspectionSettings = {
      thresholds: {
        黒点: parsed.thresholds?.黒点 ?? DEFAULT_SETTINGS.thresholds.黒点,
        キズ: parsed.thresholds?.キズ ?? DEFAULT_SETTINGS.thresholds.キズ,
        フラッシュ: parsed.thresholds?.フラッシュ ?? DEFAULT_SETTINGS.thresholds.フラッシュ,
      },
    };

    // フラッシュの閾値が古い値（0.5）の場合は新しいデフォルト（0.65）に更新
    if (settings.thresholds.フラッシュ === 0.5) {
      settings.thresholds.フラッシュ = 0.65;
      saveSettings(settings); // 自動更新
      console.log('Updated flash threshold from 0.5 to 0.65 for better accuracy');
    }

    return settings;
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
