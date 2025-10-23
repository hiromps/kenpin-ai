import { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { DefectDetail } from '../types/inspection';

interface ToastProps {
  defects: DefectDetail[];
  onClose: () => void;
}

export const Toast = ({ defects, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5秒後に自動で閉じる

    return () => clearTimeout(timer);
  }, [onClose]);

  const getDefectColor = (type: string) => {
    switch (type) {
      case '黒点':
        return 'bg-red-500';
      case '傷':
        return 'bg-orange-500';
      case 'フラッシュ':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDefectIcon = (type: string) => {
    return type === '黒点' || type === '傷' ? AlertCircle : CheckCircle;
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md animate-slide-down">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-red-500 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-bold text-lg">欠陥検出</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-3">
          {defects.map((defect, index) => {
            const Icon = getDefectIcon(defect.type);
            const colorClass = getDefectColor(defect.type);

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className={`${colorClass} rounded-full p-2 flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-base mb-1">
                    {defect.type}を検出
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${colorClass} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${(defect.confidence * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                      {(defect.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    登録サンプルと一致しました
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            このメッセージは5秒後に自動的に閉じます
          </p>
        </div>
      </div>
    </div>
  );
};
