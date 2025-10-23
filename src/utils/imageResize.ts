/**
 * 画像をリサイズしてBase64文字列を返す
 * localStorageの容量制限を回避するために画像サイズを削減
 */
export const resizeImage = (
  imageDataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // 元の画像サイズ
        let width = img.width;
        let height = img.height;

        // アスペクト比を保ちながらリサイズ
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Canvasで描画してリサイズ
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 高品質なリサイズ
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Base64に変換（JPEG形式で圧縮）
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);

        console.log('Image resized:', {
          original: `${img.width}x${img.height}`,
          resized: `${width}x${height}`,
          originalSize: `${(imageDataUrl.length / 1024).toFixed(2)}KB`,
          resizedSize: `${(resizedDataUrl.length / 1024).toFixed(2)}KB`,
        });

        resolve(resizedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageDataUrl;
  });
};

/**
 * Base64文字列のサイズを計算（KB単位）
 */
export const getBase64Size = (base64String: string): number => {
  return base64String.length / 1024;
};

/**
 * localStorageの使用可能な容量をチェック
 */
export const checkStorageAvailable = (dataSize: number): boolean => {
  try {
    // localStorageの一般的な制限は5MB
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // 現在の使用量を計算
    let currentSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += localStorage[key].length + key.length;
      }
    }

    // 追加するデータのサイズ（Base64は約1.37倍）
    const estimatedSize = dataSize * 1.37;

    console.log('Storage check:', {
      current: `${(currentSize / 1024).toFixed(2)}KB`,
      adding: `${(estimatedSize / 1024).toFixed(2)}KB`,
      total: `${((currentSize + estimatedSize) / 1024).toFixed(2)}KB`,
      limit: `${(MAX_STORAGE_SIZE / 1024).toFixed(2)}KB`,
    });

    return (currentSize + estimatedSize) < MAX_STORAGE_SIZE;
  } catch (error) {
    console.error('Storage check error:', error);
    return false;
  }
};
