import { DefectDetail } from '../types/inspection';
import { getAllSamples } from './sampleStorage';
import { findSimilarSample } from './imageSimilarity';

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

      // サンプルが登録されている場合は、サンプルとの類似度比較を行う
      if (samples.length > 0) {
        const pixelAnalysis = analyzePixels(imageData);

        // 黒点のサンプルとの比較
        if (pixelAnalysis.darkSpots > 5) {
          const darkSpotSamples = samples
            .filter((s) => s.type === '黒点')
            .map((s) => s.imageDataUrl);

          if (darkSpotSamples.length > 0) {
            const { isSimilar, maxSimilarity } = await findSimilarSample(
              imageDataUrl,
              darkSpotSamples,
              0.65
            );
            if (isSimilar) {
              defects.push({
                type: '黒点',
                confidence: maxSimilarity,
              });
            }
          }
        }

        // キズのサンプルとの比較
        if (pixelAnalysis.brightness < 80) {
          const scratchSamples = samples
            .filter((s) => s.type === 'キズ')
            .map((s) => s.imageDataUrl);

          if (scratchSamples.length > 0) {
            const { isSimilar, maxSimilarity } = await findSimilarSample(
              imageDataUrl,
              scratchSamples,
              0.65
            );
            if (isSimilar) {
              defects.push({
                type: 'キズ',
                confidence: maxSimilarity,
              });
            }
          }
        }

        // フラッシュのサンプルとの比較
        if (pixelAnalysis.irregularity > 30) {
          const flashSamples = samples
            .filter((s) => s.type === 'フラッシュ')
            .map((s) => s.imageDataUrl);

          if (flashSamples.length > 0) {
            const { isSimilar, maxSimilarity } = await findSimilarSample(
              imageDataUrl,
              flashSamples,
              0.65
            );
            if (isSimilar) {
              defects.push({
                type: 'フラッシュ',
                confidence: maxSimilarity,
              });
            }
          }
        }
      }

      resolve(defects);
    };
    img.src = imageDataUrl;
  });
};

const analyzePixels = (imageData: ImageData) => {
  const data = imageData.data;
  let darkSpots = 0;
  let totalBrightness = 0;
  let irregularity = 0;

  // より細かいサンプリングで小さな黒点も検出
  const sampleRate = 2;

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;

    // 黒点検出の閾値を調整（より敏感に）
    if (brightness < 60) {
      darkSpots++;
    }

    const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
    if (variance > 100) {
      irregularity++;
    }
  }

  const numSamples = data.length / (4 * sampleRate);
  const avgBrightness = totalBrightness / numSamples;

  return {
    darkSpots,
    brightness: avgBrightness,
    irregularity,
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
