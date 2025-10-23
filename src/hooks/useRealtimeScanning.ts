import { useEffect, useRef, useState, useCallback } from 'react';
import { analyzeImage } from '../utils/imageAnalysis';
import { DefectDetail } from '../types/inspection';

interface RealtimeScanningOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  onDefectDetected: (defects: DefectDetail[], imageDataUrl: string) => void;
  scanInterval?: number; // ミリ秒単位のスキャン間隔（デフォルト: 500ms）
  focusPoint?: { x: number; y: number } | null; // タップした位置（0-1の範囲）
}

export const useRealtimeScanning = ({
  videoRef,
  overlayCanvasRef,
  isActive,
  onDefectDetected,
  scanInterval = 500,
  focusPoint = null,
}: RealtimeScanningOptions) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const animationFrameRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ハイライトを描画する関数
  const drawHighlights = useCallback((defects: DefectDetail[]) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズを動画サイズに合わせる
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 既存の描画をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 各欠陥のハイライトを描画
    defects.forEach((defect) => {
      if (!defect.location) return;

      const { x, y, width, height } = defect.location;

      // 欠陥タイプに応じた色を設定
      let color = '#ef4444'; // 赤（デフォルト）
      if (defect.type === '黒点') {
        color = '#ef4444'; // 赤
      } else if (defect.type === 'キズ') {
        color = '#f97316'; // オレンジ
      } else if (defect.type === 'フラッシュ') {
        color = '#eab308'; // 黄色
      }

      // 矩形を描画
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // 半透明の背景
      ctx.fillStyle = color + '40'; // 25%透明度
      ctx.fillRect(x, y, width, height);

      // ラベルを描画
      ctx.fillStyle = color;
      ctx.font = 'bold 24px Arial';
      const label = `${defect.type} ${(defect.confidence * 100).toFixed(0)}%`;
      const textMetrics = ctx.measureText(label);
      const textX = x;
      const textY = y - 10;

      // ラベル背景
      ctx.fillRect(textX, textY - 24, textMetrics.width + 10, 30);

      // ラベルテキスト
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, textX + 5, textY);
    });
  }, [overlayCanvasRef, videoRef]);

  // ハイライトをクリアする関数
  const clearHighlights = useCallback(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [overlayCanvasRef]);

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

    // フォーカスポイントが指定されている場合は、その周辺領域のみを切り出す
    if (focusPoint) {
      // フォーカス領域のサイズ（ビデオの40%）
      const focusSize = 0.4;
      const focusWidth = video.videoWidth * focusSize;
      const focusHeight = video.videoHeight * focusSize;

      // フォーカスポイントを中心とした領域の座標
      const sx = Math.max(0, video.videoWidth * focusPoint.x - focusWidth / 2);
      const sy = Math.max(0, video.videoHeight * focusPoint.y - focusHeight / 2);
      const sw = Math.min(focusWidth, video.videoWidth - sx);
      const sh = Math.min(focusHeight, video.videoHeight - sy);

      canvas.width = sw;
      canvas.height = sh;

      // 指定領域のみを描画
      context.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

      console.log(`🎯 フォーカス検出モード: 中心(${(focusPoint.x * 100).toFixed(0)}%, ${(focusPoint.y * 100).toFixed(0)}%) 領域サイズ: ${sw.toFixed(0)}x${sh.toFixed(0)}px`);
    } else {
      // フォーカスポイントが指定されていない場合は全画面
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  }, [videoRef, focusPoint]);

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
        drawHighlights(defects); // ハイライト表示
        onDefectDetected(defects, imageDataUrl);
        setIsScanning(false);
        return; // スキャンを停止
      } else {
        clearHighlights(); // ハイライトをクリア
      }
    } catch (error) {
      console.error('スキャンエラー:', error);
    }

    setIsScanning(false);
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [isActive, videoRef, lastScanTime, scanInterval, captureFrame, onDefectDetected, drawHighlights, clearHighlights]);

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
