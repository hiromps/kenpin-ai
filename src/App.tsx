import { useState } from 'react';
import { Camera, ClipboardList } from 'lucide-react';
import { InspectionFlow } from './components/InspectionFlow';
import { History } from './components/History';

type ViewMode = 'inspection' | 'history';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('inspection');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">透明ケース検品システム</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('inspection')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'inspection'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-5 h-5" />
                検品
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                履歴
              </button>
            </div>
          </div>
        </div>
      </nav>

      {viewMode === 'inspection' ? <InspectionFlow /> : <History />}
    </div>
  );
}

export default App;
