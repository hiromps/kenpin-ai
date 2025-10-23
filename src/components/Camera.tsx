import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Scan } from 'lucide-react';
import { useRealtimeScanning } from '../hooks/useRealtimeScanning';
import { DefectDetail } from '../types/inspection';

interface CameraProps {
  onDefectDetected: (defects: DefectDetail[], imageDataUrl: string) => void;
  isActive: boolean;
}

export const Camera = ({ onDefectDetected, isActive }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const { isScanning } = useRealtimeScanning({
    videoRef,
    overlayCanvasRef,
    isActive,
    onDefectDetected,
    scanInterval: 500,
  });

  useEffect(() => {
    const startCamera = async () => {
      try {
        // カメラの権限チェック
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('このブラウザはカメラに対応していません');
          return;
        }

        console.log('Requesting camera access...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        console.log('Camera access granted');
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera error:', err);

        // エラーの種類に応じたメッセージ
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('カメラへのアクセスが拒否されました。\n設定からカメラの使用を許可してください。');
          } else if (err.name === 'NotFoundError') {
            setError('カメラが見つかりませんでした');
          } else if (err.name === 'NotReadableError') {
            setError('カメラが他のアプリで使用中です');
          } else if (err.name === 'SecurityError') {
            setError('HTTPS接続が必要です。\nhttps:// のURLでアクセスしてください。');
          } else {
            setError(`カメラエラー: ${err.message}`);
          }
        } else {
          setError('カメラへのアクセスに失敗しました');
        }
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-600 p-4">
        <Scan className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
        <p className="text-center text-sm sm:text-base font-bold mb-2">カメラエラー</p>
        <p className="text-center text-xs sm:text-sm whitespace-pre-line max-w-md">{error}</p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>解決方法：</strong><br/>
            1. HTTPS (https://) で接続してください<br/>
            2. iPhoneの設定 → Safari → カメラ で許可<br/>
            3. ページを再読み込みしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* 欠陥ハイライト用のCanvasオーバーレイ */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />

      {/* スキャン状態インジケーター - モバイル最適化 */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/80 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <Scan className={`w-5 h-5 sm:w-6 sm:h-6 ${isScanning ? 'animate-pulse text-green-400' : 'text-white'}`} />
          <div>
            <p className="text-xs sm:text-sm text-gray-300">連続スキャン</p>
            <p className="text-sm sm:text-lg font-bold">
              {isScanning ? 'スキャン中' : '待機中'}
            </p>
          </div>
        </div>
      </div>

      {/* 回転アイコン - モバイル最適化 */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <div className="bg-blue-500 text-white p-2 sm:p-3 rounded-full shadow-lg">
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* 使用方法 - モバイル最適化 */}
      <div className="absolute bottom-4 left-2 right-2 sm:bottom-8 sm:left-8 sm:right-8 px-3 sm:px-0">
        <div className="bg-black/80 text-white p-4 sm:p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-base sm:text-lg font-bold mb-2">使用方法</h3>
          <ul className="text-xs sm:text-sm space-y-1 text-gray-300">
            <li>• オブジェクトをゆっくり回転</li>
            <li>• 欠陥を自動検出してNG判定</li>
            <li>• 全面をスキャンしてください</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
