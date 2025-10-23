import { CheckCircle, XCircle } from 'lucide-react';
import { InspectionResult, DefectType } from '../types/inspection';

interface ResultDisplayProps {
  result: InspectionResult;
  defectType?: DefectType;
  onNext: () => void;
}

export const ResultDisplay = ({ result, defectType, onNext }: ResultDisplayProps) => {
  const isOK = result === 'OK';

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 p-4 ${
        isOK ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      {/* 結果表示 - モバイル最適化 */}
      <div className="text-white text-center">
        {isOK ? (
          <>
            <CheckCircle className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6" strokeWidth={3} />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 sm:mb-4">合格</h1>
            <p className="text-xl sm:text-2xl">OK</p>
          </>
        ) : (
          <>
            <XCircle className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6" strokeWidth={3} />
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 sm:mb-4">不良</h1>
            {defectType && (
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-lg mb-4 sm:mb-6">
                <p className="text-2xl sm:text-3xl font-bold">{defectType}</p>
              </div>
            )}
            <p className="text-xl sm:text-2xl">NG</p>
          </>
        )}
      </div>

      {/* 次へボタン - モバイル最適化 */}
      <button
        onClick={onNext}
        className="mt-8 sm:mt-12 bg-white text-gray-900 px-8 py-3 sm:px-12 sm:py-4 rounded-full text-lg sm:text-xl font-bold hover:bg-gray-100 transition-colors active:scale-95 shadow-lg"
      >
        次の製品へ
      </button>
    </div>
  );
};
