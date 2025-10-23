import { DefectSample, DefectType } from '../types/inspection';

const STORAGE_KEY = 'defect_samples';

export const saveSample = (sample: DefectSample): void => {
  try {
    const samples = getAllSamples();
    samples.push(sample);
    const jsonString = JSON.stringify(samples);

    // localStorageに保存を試みる
    localStorage.setItem(STORAGE_KEY, jsonString);

    console.log('Sample saved successfully. Total samples:', samples.length);
  } catch (error) {
    console.error('Failed to save sample:', error);

    // QuotaExceededError（容量超過）の場合
    if (error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      throw new Error('ストレージ容量が不足しています。他のサンプルを削除してください。');
    }

    throw new Error('サンプルの保存に失敗しました。もう一度お試しください。');
  }
};

export const getAllSamples = (): DefectSample[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse samples:', error);
    return [];
  }
};

export const getSamplesByType = (type: DefectType): DefectSample[] => {
  return getAllSamples().filter((sample) => sample.type === type);
};

export const deleteSample = (id: string): void => {
  const samples = getAllSamples();
  const filtered = samples.filter((sample) => sample.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const deleteAllSamples = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
