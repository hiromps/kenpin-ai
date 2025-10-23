/**
 * 2つの画像の類似度を計算する（0〜1の範囲、1が完全一致）
 */
export const calculateImageSimilarity = async (
  imageDataUrl1: string,
  imageDataUrl2: string
): Promise<number> => {
  try {
    const [imageData1, imageData2] = await Promise.all([
      getImageData(imageDataUrl1),
      getImageData(imageDataUrl2),
    ]);

    if (!imageData1 || !imageData2) return 0;

    // ヒストグラム比較による類似度計算
    const histogramSimilarity = compareHistograms(imageData1, imageData2);

    // ピクセル差分による類似度計算
    const pixelSimilarity = comparePixels(imageData1, imageData2);

    // エッジ検出による類似度計算
    const edgeSimilarity = compareEdges(imageData1, imageData2);

    // 総合的な類似度（重み付け平均）
    const totalSimilarity = histogramSimilarity * 0.4 + pixelSimilarity * 0.3 + edgeSimilarity * 0.3;

    console.log('Similarity breakdown:', {
      histogram: histogramSimilarity.toFixed(3),
      pixel: pixelSimilarity.toFixed(3),
      edge: edgeSimilarity.toFixed(3),
      total: totalSimilarity.toFixed(3),
    });

    return totalSimilarity;
  } catch (error) {
    console.error('Image similarity calculation failed:', error);
    return 0;
  }
};

const getImageData = (imageDataUrl: string): Promise<ImageData | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // 画像を標準サイズにリサイズ（比較を高速化）
      const size = 128;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      resolve(ctx.getImageData(0, 0, size, size));
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * ヒストグラム比較
 */
const compareHistograms = (imageData1: ImageData, imageData2: ImageData): number => {
  const hist1 = createHistogram(imageData1);
  const hist2 = createHistogram(imageData2);

  // カイ二乗距離を計算
  let distance = 0;
  for (let i = 0; i < 256; i++) {
    const sum = hist1[i] + hist2[i];
    if (sum > 0) {
      const diff = hist1[i] - hist2[i];
      distance += (diff * diff) / sum;
    }
  }

  // 類似度に変換（0〜1）
  return 1 / (1 + distance / 1000);
};

const createHistogram = (imageData: ImageData): number[] => {
  const histogram = new Array(256).fill(0);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // グレースケール変換
    const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
    histogram[gray]++;
  }

  return histogram;
};

/**
 * ピクセル差分比較
 */
const comparePixels = (imageData1: ImageData, imageData2: ImageData): number => {
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  const length = Math.min(data1.length, data2.length);

  let totalDiff = 0;
  for (let i = 0; i < length; i += 4) {
    const diff =
      Math.abs(data1[i] - data2[i]) +
      Math.abs(data1[i + 1] - data2[i + 1]) +
      Math.abs(data1[i + 2] - data2[i + 2]);
    totalDiff += diff;
  }

  const maxDiff = (length / 4) * 255 * 3;
  return 1 - totalDiff / maxDiff;
};

/**
 * エッジ検出による比較
 */
const compareEdges = (imageData1: ImageData, imageData2: ImageData): number => {
  const edges1 = detectEdges(imageData1);
  const edges2 = detectEdges(imageData2);

  let matchCount = 0;
  let totalCount = 0;

  for (let i = 0; i < edges1.length && i < edges2.length; i++) {
    totalCount++;
    if (Math.abs(edges1[i] - edges2[i]) < 50) {
      matchCount++;
    }
  }

  return totalCount > 0 ? matchCount / totalCount : 0;
};

const detectEdges = (imageData: ImageData): number[] => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const edges: number[] = [];

  // 簡易的なSobelフィルタ
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // グレースケール変換
      const getGray = (offset: number) => {
        const i = idx + offset;
        return (data[i] + data[i + 1] + data[i + 2]) / 3;
      };

      const gx =
        -getGray(-width * 4 - 4) +
        getGray(-width * 4 + 4) -
        2 * getGray(-4) +
        2 * getGray(4) -
        getGray(width * 4 - 4) +
        getGray(width * 4 + 4);

      const gy =
        -getGray(-width * 4 - 4) -
        2 * getGray(-width * 4) -
        getGray(-width * 4 + 4) +
        getGray(width * 4 - 4) +
        2 * getGray(width * 4) +
        getGray(width * 4 + 4);

      edges.push(Math.sqrt(gx * gx + gy * gy));
    }
  }

  return edges;
};

/**
 * 画像が登録されたサンプルのいずれかと類似しているかチェック
 */
export const findSimilarSample = async (
  imageDataUrl: string,
  sampleImages: string[],
  threshold: number = 0.7
): Promise<{ isSimilar: boolean; maxSimilarity: number }> => {
  if (sampleImages.length === 0) {
    return { isSimilar: false, maxSimilarity: 0 };
  }

  const similarities = await Promise.all(
    sampleImages.map((sampleUrl) => calculateImageSimilarity(imageDataUrl, sampleUrl))
  );

  const maxSimilarity = Math.max(...similarities);

  return {
    isSimilar: maxSimilarity >= threshold,
    maxSimilarity,
  };
};
