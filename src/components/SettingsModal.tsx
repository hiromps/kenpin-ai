import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { InspectionSettings, getSettings, saveSettings, resetSettings } from '../utils/settingsStorage';
import { DefectType } from '../types/inspection';

interface SettingsModalProps {
  onClose: () => void;
}

const DEFECT_TYPES: DefectType[] = ['黒点', 'キズ', 'フラッシュ'];

const DEFECT_COLORS = {
  黒点: 'red',
  キズ: 'orange',
  フラッシュ: 'yellow',
} as const;

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const [settings, setSettings] = useState<InspectionSettings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);

  // モーダル表示時に背景スクロールを防止
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    if (confirm('設定をデフォルトに戻しますか？')) {
      resetSettings();
      setSettings(getSettings());
    }
  };

  const handleThresholdChange = (type: DefectType, value: number) => {
    setSettings({
      ...settings,
      thresholds: {
        ...settings.thresholds,
        [type]: value / 100,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">検査設定</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 欠陥タイプごとの閾値設定 */}
          <div className="space-y-5">
            <h3 className="text-base font-bold text-gray-900">欠陥タイプごとの類似度閾値</h3>

            {DEFECT_TYPES.map((type) => {
              const percentage = Math.round(settings.thresholds[type] * 100);
              const color = DEFECT_COLORS[type];
              const colorClass =
                color === 'red' ? 'text-red-600 accent-red-600' :
                color === 'orange' ? 'text-orange-600 accent-orange-600' :
                'text-yellow-600 accent-yellow-600';
              const bgClass =
                color === 'red' ? 'bg-red-50 border-red-200' :
                color === 'orange' ? 'bg-orange-50 border-orange-200' :
                'bg-yellow-50 border-yellow-200';

              return (
                <div key={type} className={`p-4 rounded-lg border-2 ${bgClass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-gray-800">
                      {type}
                    </label>
                    <div className={`text-xl font-bold ${colorClass}`}>
                      {percentage}%
                    </div>
                  </div>

                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="5"
                    value={percentage}
                    onChange={(e) => handleThresholdChange(type, parseInt(e.target.value))}
                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClass}`}
                  />

                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>緩い</span>
                    <span>推奨</span>
                    <span>厳しい</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 説明 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-sm text-blue-900 mb-2">
              💡 閾値の設定ガイド
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>30-40%</strong>: 誤検出のリスクが高い</li>
              <li>• <strong>50-60%</strong>: バランス型（推奨）</li>
              <li>• <strong>70-90%</strong>: 検出漏れのリスクが高い</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-sm text-gray-900 mb-2">
              類似度閾値とは？
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              登録したサンプル画像と検査対象がどのくらい似ていれば欠陥と判定するかの基準です。
              欠陥タイプごとに個別に調整することで、より正確な検査が可能になります。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">リセット</span>
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg transition-colors flex-1 ${
              isSaved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSaved ? (
              <>
                <span className="text-sm font-medium">✓ 保存しました</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
