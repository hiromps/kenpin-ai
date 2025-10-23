import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Inspection, InspectionStats } from '../types/inspection';

export const History = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<InspectionStats>({
    total: 0,
    ok: 0,
    ng: 0,
    okRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setInspections(data as Inspection[]);
        calculateStats(data as Inspection[]);
      }
    } catch (error) {
      console.error('履歴取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Inspection[]) => {
    const total = data.length;
    const ok = data.filter((i) => i.result === 'OK').length;
    const ng = total - ok;
    const okRate = total > 0 ? (ok / total) * 100 : 0;

    setStats({ total, ok, ng, okRate });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">検品履歴</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">総検品数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">合格</p>
                <p className="text-3xl font-bold text-green-600">{stats.ok}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">不良</p>
                <p className="text-3xl font-bold text-red-600">{stats.ng}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">良品率</p>
                <p className="text-3xl font-bold text-blue-600">{stats.okRate.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    検品日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    判定結果
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    不良種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    端末ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(inspection.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {inspection.result === 'OK' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          合格
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4 mr-1" />
                          不良
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inspection.defect_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inspection.device_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inspections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>検品履歴がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
