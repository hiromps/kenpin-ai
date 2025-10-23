import { useState, useRef } from 'react';
import { Upload, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { DefectSample, DefectType } from '../types/inspection';
import { saveSample, getAllSamples, deleteSample } from '../utils/sampleStorage';

interface SampleManagerProps {
  onClose: () => void;
}

const DEFECT_TYPES: DefectType[] = ['黒点', 'キズ', 'フラッシュ'];

export const SampleManager = ({ onClose }: SampleManagerProps) => {
  const [samples, setSamples] = useState<DefectSample[]>(getAllSamples());
  const [selectedType, setSelectedType] = useState<DefectType>('黒点');
  const [sampleName, setSampleName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered');
    const file = event.target.files?.[0];

    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('File loaded successfully');
      const imageDataUrl = e.target?.result as string;

      if (!imageDataUrl) {
        console.error('Failed to read image data');
        setUploadError('画像の読み込みに失敗しました');
        setIsUploading(false);
        return;
      }

      try {
        const newSample: DefectSample = {
          id: `sample_${Date.now()}`,
          type: selectedType,
          name: sampleName || `${selectedType}サンプル${samples.filter((s) => s.type === selectedType).length + 1}`,
          imageDataUrl,
          createdAt: Date.now(),
        };

        console.log('Saving sample:', newSample.name);
        saveSample(newSample);

        const updatedSamples = getAllSamples();
        console.log('Updated samples count:', updatedSamples.length);
        setSamples(updatedSamples);
        setSampleName('');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setIsUploading(false);
      } catch (error) {
        console.error('Error saving sample:', error);
        setUploadError('サンプルの保存に失敗しました');
        setIsUploading(false);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setUploadError('ファイルの読み込みに失敗しました');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (confirm('このサンプルを削除しますか？')) {
      deleteSample(id);
      setSamples(getAllSamples());
    }
  };

  const filteredSamples = samples.filter((s) => s.type === selectedType);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* ヘッダー - モバイル最適化 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-2xl font-bold">欠陥サンプル管理</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* コンテンツ - モバイル最適化 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 欠陥タイプ選択 - モバイル最適化 */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              欠陥タイプ
            </label>
            <div className="flex gap-2">
              {DEFECT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-95 ${
                    selectedType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* サンプル追加 - モバイル最適化 */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-bold mb-4">新しいサンプルを追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サンプル名（任意）
                </label>
                <input
                  type="text"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder={`例: ${selectedType}サンプル1`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                />
              </div>

              {/* エラーメッセージ */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-colors ${
                    isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  } text-white`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      画像を選択
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* サンプル一覧 - モバイル最適化 */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              登録済みサンプル ({filteredSamples.length}件)
            </h3>
            {filteredSamples.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">サンプルが登録されていません</p>
                <p className="text-xs sm:text-sm mt-2">上のフォームから画像を追加してください</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredSamples.map((sample) => (
                  <div key={sample.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={sample.imageDataUrl}
                        alt={sample.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-xs sm:text-sm font-medium truncate">{sample.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sample.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(sample.id)}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター - モバイル最適化 */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">💡 使い方</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• 欠陥タイプごとにサンプル画像を登録</li>
              <li>• 登録サンプルと類似する欠陥のみNG判定</li>
              <li className="hidden sm:list-item">• サンプルが登録されていない場合、検査は実行されません</li>
              <li>• 複数登録で精度向上</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
