import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Camera } from './Camera';
import { ResultDisplay } from './ResultDisplay';
import { SampleManager } from './SampleManager';
import { CapturedImage, DefectType, InspectionResult, DefectDetail } from '../types/inspection';
import { playOKSound, playNGSound } from '../utils/audio';
import { supabase } from '../lib/supabase';
import { getAllSamples } from '../utils/sampleStorage';

export const InspectionFlow = () => {
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [defectType, setDefectType] = useState<DefectType | undefined>();
  const [showSampleManager, setShowSampleManager] = useState(false);
  const [sampleCount, setSampleCount] = useState(getAllSamples().length);
  const [deviceId] = useState(() => {
    const stored = localStorage.getItem('deviceId');
    if (stored) return stored;
    const newId = `DEVICE-${Date.now()}`;
    localStorage.setItem('deviceId', newId);
    return newId;
  });

  const handleDefectDetected = async (defects: DefectDetail[], imageDataUrl: string) => {
    try {
      const hasDefects = defects.length > 0;
      const inspectionResult: InspectionResult = hasDefects ? 'NG' : 'OK';
      const primaryDefect = defects.length > 0 ? defects[0].type : undefined;

      if (inspectionResult === 'OK') {
        playOKSound();
      } else {
        playNGSound();
      }

      setResult(inspectionResult);
      setDefectType(primaryDefect);

      const capturedImage: CapturedImage = {
        faceNumber: 1,
        dataUrl: imageDataUrl,
        timestamp: Date.now(),
      };

      await supabase.from('inspections').insert({
        result: inspectionResult,
        defect_type: primaryDefect || null,
        defect_details: defects,
        images: [capturedImage],
        device_id: deviceId,
      });
    } catch (error) {
      console.error('検品エラー:', error);
    }
  };

  const handleNext = () => {
    setResult(null);
    setDefectType(undefined);
  };

  const handleSampleManagerClose = () => {
    setShowSampleManager(false);
    setSampleCount(getAllSamples().length);
  };

  if (result) {
    return <ResultDisplay result={result} defectType={defectType} onNext={handleNext} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー - モバイル最適化 */}
      <div className="bg-gray-900 text-white p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          {/* タイトル - モバイルで短縮 */}
          <h1 className="text-sm sm:text-xl font-bold truncate">
            <span className="hidden sm:inline">透明ケース検品システム - 連続スキャンモード</span>
            <span className="sm:hidden">検品システム</span>
          </h1>

          {/* 右側のコントロール */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* サンプル数表示 */}
            <div className="text-xs sm:text-sm">
              <span className="text-gray-400 hidden sm:inline">登録サンプル:</span>
              <span className="ml-1 sm:ml-2 font-bold">{sampleCount}件</span>
            </div>

            {/* サンプル管理ボタン */}
            <button
              onClick={() => setShowSampleManager(true)}
              className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base active:scale-95"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">サンプル管理</span>
              <span className="sm:hidden">管理</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Camera onDefectDetected={handleDefectDetected} isActive={!showSampleManager} />
      </div>

      {showSampleManager && <SampleManager onClose={handleSampleManagerClose} />}
    </div>
  );
};
