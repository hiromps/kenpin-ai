import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { InspectionSettings, getSettings, saveSettings, resetSettings } from '../utils/settingsStorage';

interface SettingsModalProps {
  onClose: () => void;
}

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

  const thresholdPercentage = Math.round(settings.similarityThreshold * 100);

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
          {/* 類似度閾値設定 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                類似度の閾値
              </label>
              <div className="text-2xl font-bold text-blue-600">
                {thresholdPercentage}%
              </div>
            </div>

            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={thresholdPercentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  similarityThreshold: parseInt(e.target.value) / 100,
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>30%（緩い）</span>
              <span>50%（推奨）</span>
              <span>90%（厳しい）</span>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">
                💡 閾値の目安
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>30-40%</strong>: 誤検出のリスクが高い</li>
                <li>• <strong>50-60%</strong>: バランス型（推奨）</li>
                <li>• <strong>70-90%</strong>: 検出漏れのリスクが高い</li>
              </ul>
            </div>
          </div>

          {/* 説明 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-sm text-gray-900 mb-2">
              類似度閾値とは？
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              登録したサンプル画像と検査対象がどのくらい似ていれば欠陥と判定するかの基準です。
              値を<strong>低く</strong>すると検出しやすくなりますが誤検出も増えます。
              値を<strong>高く</strong>すると正確になりますが検出漏れが増えます。
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
