/**
 * 2つの画像の類似度を計算する（0〜1の範囲、1が完全一致）
 * 高精度版：複数の特徴量を組み合わせて比較
 */
export const calculateImageSimilarity = async (
  imageDataUrl1: string,
  imageDataUrl2: string,
  defectType?: string
): Promise<number> => {
  try {
    const [imageData1, imageData2] = await Promise.all([
      getImageData(imageDataUrl1),
      getImageData(imageDataUrl2),
    ]);

    if (!imageData1 || !imageData2) return 0;

    // フラッシュ専用の高精度検出
    if (defectType === 'フラッシュ') {
      return calculateFlashSimilarity(imageData1, imageData2);
    }

    // 1. RGB各チャンネルのヒストグラム比較
    const histogramSimilarity = compareRGBHistograms(imageData1, imageData2);

    // 2. 構造的類似性（SSIM風）
    const structuralSimilarity = compareStructure(imageData1, imageData2);

    // 3. エッジ検出による類似度計算（改善版）
    const edgeSimilarity = compareEdges(imageData1, imageData2);

    // 4. 局所特徴量の比較
    const localFeatureSimilarity = compareLocalFeatures(imageData1, imageData2);

    // 5. 色分布の類似性
    const colorSimilarity = compareColorDistribution(imageData1, imageData2);

    // 総合的な類似度（最適化された重み付け平均）
    const totalSimilarity =
      histogramSimilarity * 0.25 +      // RGBヒストグラム
      structuralSimilarity * 0.30 +     // 構造的類似性（最重要）
      edgeSimilarity * 0.20 +            // エッジパターン
      localFeatureSimilarity * 0.15 +    // 局所特徴
      colorSimilarity * 0.10;            // 色分布

    console.log('High-precision similarity breakdown:', {
      histogram: histogramSimilarity.toFixed(3),
      structural: structuralSimilarity.toFixed(3),
      edge: edgeSimilarity.toFixed(3),
      localFeature: localFeatureSimilarity.toFixed(3),
      color: colorSimilarity.toFixed(3),
      total: totalSimilarity.toFixed(3),
    });

    return totalSimilarity;
  } catch (error) {
    console.error('Image similarity calculation failed:', error);
    return 0;
  }
};

/**
 * フラッシュ（成形不良）専用の類似度計算
 * テクスチャ、表面粗さ、光沢パターンに特化
 */
const calculateFlashSimilarity = (imageData1: ImageData, imageData2: ImageData): number => {
  // 1. テクスチャエネルギー比較（最重要）
  const textureSimilarity = compareTexture(imageData1, imageData2);

  // 2. 表面粗さの比較
  const roughnessSimilarity = compareSurfaceRoughness(imageData1, imageData2);

  // 3. 光沢パターンの比較
  const glossSimilarity = compareGlossPattern(imageData1, imageData2);

  // 4. 局所的な分散の比較
  const varianceSimilarity = compareLocalVariance(imageData1, imageData2);

  // 5. 高周波成分の比較
  const frequencySimilarity = compareHighFrequency(imageData1, imageData2);

  // 6. エッジの不規則性比較
  const edgeIrregularity = compareEdgeIrregularity(imageData1, imageData2);

  // フラッシュ特化の重み付け
  const totalSimilarity =
    textureSimilarity * 0.30 +        // テクスチャ（最重要）
    roughnessSimilarity * 0.25 +      // 表面粗さ
    glossSimilarity * 0.15 +          // 光沢パターン
    varianceSimilarity * 0.15 +       // 局所分散
    frequencySimilarity * 0.10 +      // 高周波成分
    edgeIrregularity * 0.05;          // エッジ不規則性

  console.log('Flash-specific similarity breakdown:', {
    texture: textureSimilarity.toFixed(3),
    roughness: roughnessSimilarity.toFixed(3),
    gloss: glossSimilarity.toFixed(3),
    variance: varianceSimilarity.toFixed(3),
    frequency: frequencySimilarity.toFixed(3),
    edgeIrregularity: edgeIrregularity.toFixed(3),
    total: totalSimilarity.toFixed(3),
  });

  return totalSimilarity;
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

      // 画像を256x256にリサイズ（精度と速度のバランス）
      const size = 256;
      canvas.width = size;
      canvas.height = size;

      // 高品質な補間でリサイズ
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);

      resolve(ctx.getImageData(0, 0, size, size));
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
};

/**
 * RGB各チャンネルのヒストグラム比較（色情報を活用）
 */
const compareRGBHistograms = (imageData1: ImageData, imageData2: ImageData): number => {
  const histR1 = new Array(256).fill(0);
  const histG1 = new Array(256).fill(0);
  const histB1 = new Array(256).fill(0);
  const histR2 = new Array(256).fill(0);
  const histG2 = new Array(256).fill(0);
  const histB2 = new Array(256).fill(0);

  const data1 = imageData1.data;
  const data2 = imageData2.data;

  // ヒストグラム作成
  for (let i = 0; i < data1.length; i += 4) {
    histR1[data1[i]]++;
    histG1[data1[i + 1]]++;
    histB1[data1[i + 2]]++;
  }
  for (let i = 0; i < data2.length; i += 4) {
    histR2[data2[i]]++;
    histG2[data2[i + 1]]++;
    histB2[data2[i + 2]]++;
  }

  // 正規化
  const totalPixels1 = data1.length / 4;
  const totalPixels2 = data2.length / 4;

  for (let i = 0; i < 256; i++) {
    histR1[i] /= totalPixels1;
    histG1[i] /= totalPixels1;
    histB1[i] /= totalPixels1;
    histR2[i] /= totalPixels2;
    histG2[i] /= totalPixels2;
    histB2[i] /= totalPixels2;
  }

  // バタチャリヤ距離で比較（より高精度）
  const compareChannel = (hist1: number[], hist2: number[]): number => {
    let bc = 0;
    for (let i = 0; i < 256; i++) {
      bc += Math.sqrt(hist1[i] * hist2[i]);
    }
    return bc;
  };

  const rSim = compareChannel(histR1, histR2);
  const gSim = compareChannel(histG1, histG2);
  const bSim = compareChannel(histB1, histB2);

  return (rSim + gSim + bSim) / 3;
};

/**
 * 構造的類似性（SSIM風の簡易版）
 */
const compareStructure = (imageData1: ImageData, imageData2: ImageData): number => {
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  const width = imageData1.width;
  const height = imageData1.height;

  let sumLuminance1 = 0;
  let sumLuminance2 = 0;
  let sumLuminance1Sq = 0;
  let sumLuminance2Sq = 0;
  let sumProduct = 0;
  let count = 0;

  // 8x8ブロックでサンプリング（計算量削減）
  const blockSize = 8;
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const idx = (y * width + x) * 4;

      // 輝度計算（ITU-R BT.601）
      const l1 = 0.299 * data1[idx] + 0.587 * data1[idx + 1] + 0.114 * data1[idx + 2];
      const l2 = 0.299 * data2[idx] + 0.587 * data2[idx + 1] + 0.114 * data2[idx + 2];

      sumLuminance1 += l1;
      sumLuminance2 += l2;
      sumLuminance1Sq += l1 * l1;
      sumLuminance2Sq += l2 * l2;
      sumProduct += l1 * l2;
      count++;
    }
  }

  const meanL1 = sumLuminance1 / count;
  const meanL2 = sumLuminance2 / count;
  const varL1 = sumLuminance1Sq / count - meanL1 * meanL1;
  const varL2 = sumLuminance2Sq / count - meanL2 * meanL2;
  const covar = sumProduct / count - meanL1 * meanL2;

  const c1 = 6.5025; // (0.01 * 255)^2
  const c2 = 58.5225; // (0.03 * 255)^2

  const ssim =
    ((2 * meanL1 * meanL2 + c1) * (2 * covar + c2)) /
    ((meanL1 * meanL1 + meanL2 * meanL2 + c1) * (varL1 + varL2 + c2));

  return Math.max(0, Math.min(1, ssim));
};

/**
 * 局所特徴量の比較（パッチベース）
 */
const compareLocalFeatures = (imageData1: ImageData, imageData2: ImageData): number => {
  const data1 = imageData1.data;
  const data2 = imageData2.data;
  const width = imageData1.width;
  const height = imageData1.height;

  // 16x16パッチで特徴を抽出
  const patchSize = 16;
  let totalSimilarity = 0;
  let patchCount = 0;

  for (let y = 0; y < height - patchSize; y += patchSize) {
    for (let x = 0; x < width - patchSize; x += patchSize) {
      let patchDiff = 0;
      let pixelCount = 0;

      for (let py = 0; py < patchSize; py += 2) {
        for (let px = 0; px < patchSize; px += 2) {
          const idx = ((y + py) * width + (x + px)) * 4;

          const diff = Math.abs(data1[idx] - data2[idx]) +
                      Math.abs(data1[idx + 1] - data2[idx + 1]) +
                      Math.abs(data1[idx + 2] - data2[idx + 2]);

          patchDiff += diff;
          pixelCount++;
        }
      }

      const patchSimilarity = 1 - (patchDiff / (pixelCount * 255 * 3));
      totalSimilarity += patchSimilarity;
      patchCount++;
    }
  }

  return patchCount > 0 ? totalSimilarity / patchCount : 0;
};

/**
 * 色分布の類似性
 */
const compareColorDistribution = (imageData1: ImageData, imageData2: ImageData): number => {
  const data1 = imageData1.data;
  const data2 = imageData2.data;

  // 色相・彩度・明度の分布を比較
  let totalDiff = 0;
  let count = 0;

  for (let i = 0; i < data1.length; i += 16) { // サンプリング
    const r1 = data1[i] / 255;
    const g1 = data1[i + 1] / 255;
    const b1 = data1[i + 2] / 255;

    const r2 = data2[i] / 255;
    const g2 = data2[i + 1] / 255;
    const b2 = data2[i + 2] / 255;

    // 簡易的なHSV変換の差分
    const max1 = Math.max(r1, g1, b1);
    const min1 = Math.min(r1, g1, b1);
    const max2 = Math.max(r2, g2, b2);
    const min2 = Math.min(r2, g2, b2);

    const v1 = max1;
    const v2 = max2;
    const s1 = max1 === 0 ? 0 : (max1 - min1) / max1;
    const s2 = max2 === 0 ? 0 : (max2 - min2) / max2;

    const vDiff = Math.abs(v1 - v2);
    const sDiff = Math.abs(s1 - s2);

    totalDiff += vDiff + sDiff;
    count++;
  }

  return 1 - Math.min(1, totalDiff / (count * 2));
};

/**
 * エッジ検出による比較（改善版）
 */
const compareEdges = (imageData1: ImageData, imageData2: ImageData): number => {
  const edges1 = detectEdges(imageData1);
  const edges2 = detectEdges(imageData2);

  if (edges1.length === 0 || edges2.length === 0) return 0;

  // エッジの強度の相関係数を計算
  let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sumProduct = 0;
  const count = Math.min(edges1.length, edges2.length);

  for (let i = 0; i < count; i++) {
    sum1 += edges1[i];
    sum2 += edges2[i];
    sum1Sq += edges1[i] * edges1[i];
    sum2Sq += edges2[i] * edges2[i];
    sumProduct += edges1[i] * edges2[i];
  }

  const mean1 = sum1 / count;
  const mean2 = sum2 / count;
  const var1 = sum1Sq / count - mean1 * mean1;
  const var2 = sum2Sq / count - mean2 * mean2;
  const covar = sumProduct / count - mean1 * mean2;

  const denominator = Math.sqrt(var1 * var2);
  if (denominator === 0) return 0;

  const correlation = covar / denominator;

  // 相関係数を0〜1の範囲に変換
  return (correlation + 1) / 2;
};

const detectEdges = (imageData: ImageData): number[] => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const edges: number[] = [];

  // Sobelフィルタ（改善版）- サンプリングで高速化
  const step = 2; // 2ピクセルごとにサンプリング
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;

      // 輝度計算（ITU-R BT.601）
      const getLuminance = (offset: number) => {
        const i = idx + offset;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // Sobelカーネル
      const gx =
        -getLuminance(-width * 4 - 4) +
        getLuminance(-width * 4 + 4) -
        2 * getLuminance(-4) +
        2 * getLuminance(4) -
        getLuminance(width * 4 - 4) +
        getLuminance(width * 4 + 4);

      const gy =
        -getLuminance(-width * 4 - 4) -
        2 * getLuminance(-width * 4) -
        getLuminance(-width * 4 + 4) +
        getLuminance(width * 4 - 4) +
        2 * getLuminance(width * 4) +
        getLuminance(width * 4 + 4);

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges.push(magnitude);
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
  threshold: number = 0.7,
  defectType?: string
): Promise<{ isSimilar: boolean; maxSimilarity: number }> => {
  if (sampleImages.length === 0) {
    return { isSimilar: false, maxSimilarity: 0 };
  }

  const similarities = await Promise.all(
    sampleImages.map((sampleUrl) => calculateImageSimilarity(imageDataUrl, sampleUrl, defectType))
  );

  const maxSimilarity = Math.max(...similarities);

  return {
    isSimilar: maxSimilarity >= threshold,
    maxSimilarity,
  };
};

/**
 * テクスチャエネルギー比較（Gray Level Co-occurrence Matrix風）
 */
const compareTexture = (imageData1: ImageData, imageData2: ImageData): number => {
  const texture1 = calculateTextureEnergy(imageData1);
  const texture2 = calculateTextureEnergy(imageData2);

  // エネルギー、コントラスト、均一性の比較
  let similarity = 0;
  similarity += 1 - Math.abs(texture1.energy - texture2.energy);
  similarity += 1 - Math.abs(texture1.contrast - texture2.contrast) / 100;
  similarity += 1 - Math.abs(texture1.homogeneity - texture2.homogeneity);

  return Math.max(0, similarity / 3);
};

const calculateTextureEnergy = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let energy = 0;
  let contrast = 0;
  let homogeneity = 0;
  let count = 0;

  // 8x8ブロックでテクスチャ特徴を計算
  const blockSize = 8;
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const blockValues: number[] = [];

      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          blockValues.push(luminance);
        }
      }

      // エネルギー（均一性）
      const mean = blockValues.reduce((a, b) => a + b, 0) / blockValues.length;
      const variance = blockValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / blockValues.length;
      energy += variance;

      // コントラスト
      const maxVal = Math.max(...blockValues);
      const minVal = Math.min(...blockValues);
      contrast += (maxVal - minVal);

      // 均一性
      homogeneity += 1 / (1 + variance);

      count++;
    }
  }

  return {
    energy: energy / count / 10000, // 正規化
    contrast: contrast / count,
    homogeneity: homogeneity / count,
  };
};

/**
 * 表面粗さの比較
 */
const compareSurfaceRoughness = (imageData1: ImageData, imageData2: ImageData): number => {
  const roughness1 = calculateRoughness(imageData1);
  const roughness2 = calculateRoughness(imageData2);

  const diff = Math.abs(roughness1 - roughness2);
  return Math.max(0, 1 - diff);
};

const calculateRoughness = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let totalRoughness = 0;
  let count = 0;

  // 局所的な勾配の標準偏差を計算
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;

      const getLuminance = (offset: number) => {
        const i = idx + offset;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // 周囲8方向の勾配
      const gradients = [
        Math.abs(getLuminance(0) - getLuminance(-width * 4)),     // 上
        Math.abs(getLuminance(0) - getLuminance(width * 4)),      // 下
        Math.abs(getLuminance(0) - getLuminance(-4)),             // 左
        Math.abs(getLuminance(0) - getLuminance(4)),              // 右
        Math.abs(getLuminance(0) - getLuminance(-width * 4 - 4)), // 左上
        Math.abs(getLuminance(0) - getLuminance(-width * 4 + 4)), // 右上
        Math.abs(getLuminance(0) - getLuminance(width * 4 - 4)),  // 左下
        Math.abs(getLuminance(0) - getLuminance(width * 4 + 4)),  // 右下
      ];

      const mean = gradients.reduce((a, b) => a + b, 0) / gradients.length;
      const variance = gradients.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gradients.length;

      totalRoughness += Math.sqrt(variance);
      count++;
    }
  }

  return totalRoughness / count / 100; // 正規化
};

/**
 * 光沢パターンの比較
 */
const compareGlossPattern = (imageData1: ImageData, imageData2: ImageData): number => {
  const gloss1 = calculateGlossPattern(imageData1);
  const gloss2 = calculateGlossPattern(imageData2);

  // 高輝度領域の分布を比較
  const brightDiff = Math.abs(gloss1.brightRatio - gloss2.brightRatio);
  const patternDiff = Math.abs(gloss1.patternComplexity - gloss2.patternComplexity);

  return Math.max(0, 1 - (brightDiff + patternDiff) / 2);
};

const calculateGlossPattern = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let brightPixels = 0;
  let totalPixels = 0;
  const brightThreshold = 200; // 高輝度の閾値

  let patternChanges = 0;
  let prevBright = false;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      const isBright = luminance > brightThreshold;
      if (isBright) brightPixels++;

      // パターンの変化をカウント
      if (isBright !== prevBright) patternChanges++;
      prevBright = isBright;

      totalPixels++;
    }
  }

  return {
    brightRatio: brightPixels / totalPixels,
    patternComplexity: patternChanges / totalPixels,
  };
};

/**
 * 局所的な分散の比較
 */
const compareLocalVariance = (imageData1: ImageData, imageData2: ImageData): number => {
  const variance1 = calculateLocalVariance(imageData1);
  const variance2 = calculateLocalVariance(imageData2);

  const diff = Math.abs(variance1 - variance2);
  return Math.max(0, 1 - diff);
};

const calculateLocalVariance = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let totalVariance = 0;
  let count = 0;

  // 16x16ブロックで局所分散を計算
  const blockSize = 16;
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const blockValues: number[] = [];

      for (let by = 0; by < blockSize; by += 2) {
        for (let bx = 0; bx < blockSize; bx += 2) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          blockValues.push(luminance);
        }
      }

      const mean = blockValues.reduce((a, b) => a + b, 0) / blockValues.length;
      const variance = blockValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / blockValues.length;

      totalVariance += variance;
      count++;
    }
  }

  return totalVariance / count / 10000; // 正規化
};

/**
 * 高周波成分の比較（細かいテクスチャ）
 */
const compareHighFrequency = (imageData1: ImageData, imageData2: ImageData): number => {
  const freq1 = calculateHighFrequency(imageData1);
  const freq2 = calculateHighFrequency(imageData2);

  const diff = Math.abs(freq1 - freq2);
  return Math.max(0, 1 - diff);
};

const calculateHighFrequency = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let highFreqEnergy = 0;
  let count = 0;

  // ラプラシアンフィルタで高周波成分を抽出
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;

      const getLuminance = (offset: number) => {
        const i = idx + offset;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // ラプラシアンカーネル
      const laplacian =
        -4 * getLuminance(0) +
        getLuminance(-width * 4) +
        getLuminance(width * 4) +
        getLuminance(-4) +
        getLuminance(4);

      highFreqEnergy += Math.abs(laplacian);
      count++;
    }
  }

  return highFreqEnergy / count / 1000; // 正規化
};

/**
 * エッジの不規則性比較
 */
const compareEdgeIrregularity = (imageData1: ImageData, imageData2: ImageData): number => {
  const irregularity1 = calculateEdgeIrregularity(imageData1);
  const irregularity2 = calculateEdgeIrregularity(imageData2);

  const diff = Math.abs(irregularity1 - irregularity2);
  return Math.max(0, 1 - diff);
};

const calculateEdgeIrregularity = (imageData: ImageData): number => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let irregularity = 0;
  let count = 0;

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const idx = (y * width + x) * 4;

      const getLuminance = (offset: number) => {
        const i = idx + offset;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // Sobelでエッジ強度を計算
      const gx =
        -getLuminance(-width * 4 - 4) + getLuminance(-width * 4 + 4) -
        2 * getLuminance(-4) + 2 * getLuminance(4) -
        getLuminance(width * 4 - 4) + getLuminance(width * 4 + 4);

      const gy =
        -getLuminance(-width * 4 - 4) - 2 * getLuminance(-width * 4) - getLuminance(-width * 4 + 4) +
        getLuminance(width * 4 - 4) + 2 * getLuminance(width * 4) + getLuminance(width * 4 + 4);

      const edgeStrength = Math.sqrt(gx * gx + gy * gy);

      // 周囲のエッジ強度との差を計算（不規則性）
      const neighbors = [
        Math.sqrt(Math.pow(gx + 1, 2) + Math.pow(gy, 2)),
        Math.sqrt(Math.pow(gx - 1, 2) + Math.pow(gy, 2)),
        Math.sqrt(Math.pow(gx, 2) + Math.pow(gy + 1, 2)),
        Math.sqrt(Math.pow(gx, 2) + Math.pow(gy - 1, 2)),
      ];

      const meanNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
      irregularity += Math.abs(edgeStrength - meanNeighbor);
      count++;
    }
  }

  return irregularity / count / 100; // 正規化
};
