import { DefectSample, DefectType } from '../types/inspection';

const STORAGE_KEY = 'defect_samples';

export const saveSample = (sample: DefectSample): void => {
  const samples = getAllSamples();
  samples.push(sample);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
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
