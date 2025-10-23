import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import { useRealtimeScanning } from '../hooks/useRealtimeScanning';
import { DefectDetail } from '../types/inspection';

interface CameraProps {
  onDefectDetected: (defects: DefectDetail[], imageDataUrl: string) => void;
  isActive: boolean;
}

export const Camera = ({ onDefectDetected, isActive }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // フォーカスポイント用
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);

  // ピンチジェスチャー用
  const lastTouchDistanceRef = useRef<number>(0);
  const isPinchingRef = useRef(false);

  const { isScanning } = useRealtimeScanning({
    videoRef,
    overlayCanvasRef,
    isActive,
    onDefectDetected,
    scanInterval: 500,
    focusPoint,
  });

  // ズーム機能
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5)); // 最大5倍
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1)); // 最小1倍
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // マウスホイールでズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  // ピンチジェスチャーでズーム
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const delta = (distance - lastTouchDistanceRef.current) * 0.01;
      setZoom((prev) => Math.max(1, Math.min(5, prev + delta)));
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = () => {
    isPinchingRef.current = false;
  };

  // タップ/クリックでフォーカスポイント設定
  const handleFocusPoint = (e: React.MouseEvent | React.TouchEvent) => {
    // ピンチ中は無視
    if (isPinchingRef.current) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e && e.touches.length === 1) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    // コンテナ内のクリック座標（ピクセル単位）
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // コンテナの中心座標
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 中心からのオフセット（ピクセル単位）
    const offsetX = clickX - centerX;
    const offsetY = clickY - centerY;

    // ズームとパンの逆変換
    // transform: scale(zoom) translate(panX, panY) の逆変換
    // 1. パンの影響を除去（panは変換後の座標系での移動）
    // 2. ズームの影響を除去
    const actualOffsetX = (offsetX - panX) / zoom;
    const actualOffsetY = (offsetY - panY) / zoom;

    // 実際のビデオ座標（0-1の範囲）
    const x = (actualOffsetX + centerX) / rect.width;
    const y = (actualOffsetY + centerY) / rect.height;

    // 範囲を0-1にクランプ
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setFocusPoint({ x: clampedX, y: clampedY });
    setShowFocusIndicator(true);

    console.log(`🎯 フォーカス設定: (${(clampedX * 100).toFixed(0)}%, ${(clampedY * 100).toFixed(0)}%) ズーム: ${zoom.toFixed(1)}x`);

    // フォーカスインジケーターを2秒後に非表示
    setTimeout(() => {
      setShowFocusIndicator(false);
    }, 2000);

    // カメラのフォーカスポイントを設定（対応している場合）
    if (videoRef.current && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();

      if (capabilities && 'focusMode' in capabilities) {
        videoTrack.applyConstraints({
          advanced: [{ focusMode: 'manual', pointsOfInterest: [{ x: clampedX, y: clampedY }] } as any]
        }).catch(() => {
          // フォーカス設定に失敗しても続行（一部のデバイスでは非対応）
        });
      }
    }
  };

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
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleFocusPoint}
    >
      <div
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center',
          transition: isPinchingRef.current ? 'none' : 'transform 0.1s ease-out',
        }}
        className="w-full h-full"
      >
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

        {/* フォーカスインジケーター */}
        {showFocusIndicator && focusPoint && (
          <div
            className="absolute w-16 h-16 sm:w-20 sm:h-20 pointer-events-none"
            style={{
              left: `${focusPoint.x * 100}%`,
              top: `${focusPoint.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* 外側の円 */}
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>
            {/* 内側の円 */}
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-full"></div>
            {/* 十字線 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-0.5 bg-yellow-400"></div>
              <div className="absolute w-0.5 h-full bg-yellow-400"></div>
            </div>
          </div>
        )}
      </div>

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

      {/* ズームコントロール - モバイル最適化 */}
      <div className="absolute top-16 right-2 sm:top-20 sm:right-4 flex flex-col gap-2">
        {/* ズームイン */}
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className="bg-black/80 text-white p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-all"
        >
          <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* ズーム表示 & リセット */}
        <button
          onClick={handleZoomReset}
          disabled={zoom === 1}
          className="bg-black/80 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg shadow-lg backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-all"
        >
          <span className="text-xs sm:text-sm font-bold">{zoom.toFixed(1)}x</span>
        </button>

        {/* ズームアウト */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="bg-black/80 text-white p-2 sm:p-3 rounded-full shadow-lg backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-all"
        >
          <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* 使用方法 - モバイル最適化 */}
      <div className="absolute bottom-4 left-2 right-2 sm:bottom-8 sm:left-8 sm:right-8 px-3 sm:px-0">
        <div className="bg-black/80 text-white p-4 sm:p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-base sm:text-lg font-bold mb-2">使用方法</h3>
          <ul className="text-xs sm:text-sm space-y-1 text-gray-300">
            <li>• オブジェクトをゆっくり回転</li>
            <li>• 欠陥を自動検出してNG判定</li>
            <li>• タップで部分検出（焦点検査）</li>
            <li>• ズーム機能で細部を検査可能</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
