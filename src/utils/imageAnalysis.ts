import { DefectDetail } from '../types/inspection';
import { getAllSamples } from './sampleStorage';
import { findSimilarSample } from './imageSimilarity';
import { getSettings } from './settingsStorage';

export const analyzeImage = async (imageDataUrl: string): Promise<DefectDetail[]> => {
  return new Promise(async (resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const defects: DefectDetail[] = [];

      // サンプル画像を取得
      const samples = getAllSamples();

      // 設定から欠陥タイプごとの閾値を取得
      const settings = getSettings();
      console.log('Using thresholds:', {
        黒点: (settings.thresholds.黒点 * 100).toFixed(0) + '%',
        キズ: (settings.thresholds.キズ * 100).toFixed(0) + '%',
        フラッシュ: (settings.thresholds.フラッシュ * 100).toFixed(0) + '%',
      });

      // サンプルが登録されている場合は、サンプルとの類似度比較を行う
      if (samples.length > 0) {
        const pixelAnalysis = analyzePixels(imageData);

        console.log('Pixel analysis:', {
          darkSpots: pixelAnalysis.darkSpots,
          brightness: pixelAnalysis.brightness,
          irregularity: pixelAnalysis.irregularity,
        });

        // 黒点のサンプルとの比較
        const darkSpotSamples = samples
          .filter((s) => s.type === '黒点')
          .map((s) => s.imageDataUrl);

        if (darkSpotSamples.length > 0) {
          console.log(`Checking against ${darkSpotSamples.length} 黒点 samples (threshold: ${(settings.thresholds.黒点 * 100).toFixed(0)}%)`);
          const { isSimilar, maxSimilarity } = await findSimilarSample(
            imageDataUrl,
            darkSpotSamples,
            settings.thresholds.黒点
          );
          console.log('黒点 similarity:', maxSimilarity, 'isSimilar:', isSimilar);

          if (isSimilar) {
            defects.push({
              type: '黒点',
              confidence: maxSimilarity,
              location: pixelAnalysis.darkSpotLocation || undefined,
            });
          }
        }

        // キズのサンプルとの比較
        const scratchSamples = samples
          .filter((s) => s.type === 'キズ')
          .map((s) => s.imageDataUrl);

        if (scratchSamples.length > 0) {
          console.log(`Checking against ${scratchSamples.length} キズ samples (threshold: ${(settings.thresholds.キズ * 100).toFixed(0)}%)`);
          const { isSimilar, maxSimilarity } = await findSimilarSample(
            imageDataUrl,
            scratchSamples,
            settings.thresholds.キズ
          );
          console.log('キズ similarity:', maxSimilarity, 'isSimilar:', isSimilar);

          if (isSimilar) {
            defects.push({
              type: 'キズ',
              confidence: maxSimilarity,
              location: pixelAnalysis.darkSpotLocation || undefined,
            });
          }
        }

        // フラッシュのサンプルとの比較
        const flashSamples = samples
          .filter((s) => s.type === 'フラッシュ')
          .map((s) => s.imageDataUrl);

        if (flashSamples.length > 0) {
          console.log(`Checking against ${flashSamples.length} フラッシュ samples (threshold: ${(settings.thresholds.フラッシュ * 100).toFixed(0)}%)`);
          const { isSimilar, maxSimilarity } = await findSimilarSample(
            imageDataUrl,
            flashSamples,
            settings.thresholds.フラッシュ
          );
          console.log('フラッシュ similarity:', maxSimilarity, 'isSimilar:', isSimilar);

          if (isSimilar) {
            defects.push({
              type: 'フラッシュ',
              confidence: maxSimilarity,
              location: pixelAnalysis.irregularLocation || undefined,
            });
          }
        }
      }

      if (defects.length > 0) {
        console.log('✅ Defects detected:', defects.map(d => `${d.type} (${(d.confidence * 100).toFixed(1)}%)`).join(', '));
      } else {
        console.log('✓ No defects detected');
      }

      resolve(defects);
    };
    img.src = imageDataUrl;
  });
};

const analyzePixels = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let darkSpots = 0;
  let totalBrightness = 0;
  let irregularity = 0;

  // 位置情報を記録
  const darkPixels: {x: number, y: number}[] = [];
  const irregularPixels: {x: number, y: number}[] = [];

  // より細かいサンプリングで小さな黒点も検出
  const sampleRate = 2;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // 黒点検出の閾値を調整（より敏感に）
      if (brightness < 60) {
        darkSpots++;
        darkPixels.push({x, y});
      }

      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      if (variance > 100) {
        irregularity++;
        irregularPixels.push({x, y});
      }
    }
  }

  const numSamples = (width / sampleRate) * (height / sampleRate);
  const avgBrightness = totalBrightness / numSamples;

  // バウンディングボックスを計算
  const darkSpotLocation = calculateBoundingBox(darkPixels, width, height);
  const irregularLocation = calculateBoundingBox(irregularPixels, width, height);

  return {
    darkSpots,
    brightness: avgBrightness,
    irregularity,
    darkSpotLocation,
    irregularLocation,
  };
};

const calculateBoundingBox = (
  pixels: {x: number, y: number}[],
  imageWidth: number,
  imageHeight: number
) => {
  if (pixels.length === 0) return null;

  let minX = imageWidth;
  let minY = imageHeight;
  let maxX = 0;
  let maxY = 0;

  for (const pixel of pixels) {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  }

  // 少し余白を追加
  const padding = 20;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(imageWidth, maxX + padding);
  maxY = Math.min(imageHeight, maxY + padding);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const analyzeAllImages = async (images: string[]): Promise<DefectDetail[]> => {
  const allDefects: DefectDetail[] = [];

  for (const imageDataUrl of images) {
    const defects = await analyzeImage(imageDataUrl);
    allDefects.push(...defects);
  }

  return allDefects;
};
