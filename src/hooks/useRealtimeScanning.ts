import { useEffect, useRef, useState, useCallback } from 'react';
import { analyzeImage } from '../utils/imageAnalysis';
import { DefectDetail } from '../types/inspection';

interface RealtimeScanningOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onDefectDetected: (defects: DefectDetail[], imageDataUrl: string) => void;
  scanInterval?: number; // ミリ秒単位のスキャン間隔（デフォルト: 500ms）
}

export const useRealtimeScanning = ({
  videoRef,
  isActive,
  onDefectDetected,
  scanInterval = 500,
}: RealtimeScanningOptions) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const animationFrameRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const video = videoRef.current;

    // キャンバスが存在しない場合は作成
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, [videoRef]);

  const scanFrame = useCallback(async () => {
    if (!isActive || !videoRef.current) return;

    const now = Date.now();

    // スキャン間隔チェック
    if (now - lastScanTime < scanInterval) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    setIsScanning(true);
    setLastScanTime(now);

    try {
      const imageDataUrl = captureFrame();
      if (!imageDataUrl) {
        setIsScanning(false);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // 欠陥検出
      const defects = await analyzeImage(imageDataUrl);

      // 欠陥が見つかった場合
      if (defects.length > 0) {
        onDefectDetected(defects, imageDataUrl);
        setIsScanning(false);
        return; // スキャンを停止
      }
    } catch (error) {
      console.error('スキャンエラー:', error);
    }

    setIsScanning(false);
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [isActive, videoRef, lastScanTime, scanInterval, captureFrame, onDefectDetected]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      // スキャン開始
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } else {
      // スキャン停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, [isActive, videoRef, scanFrame]);

  return { isScanning };
};
