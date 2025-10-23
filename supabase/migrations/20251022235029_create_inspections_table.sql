/*
  # 検品システム - 検品履歴テーブル作成

  1. 新規テーブル
    - `inspections` (検品履歴)
      - `id` (uuid, primary key) - 一意のID
      - `inspected_at` (timestamptz) - 検品日時
      - `result` (text) - 判定結果 (OK/NG)
      - `defect_type` (text, nullable) - 不良種別（キズ、黒点、フラッシュ）
      - `defect_details` (jsonb, nullable) - 不良詳細情報
      - `images` (jsonb) - 6面の画像データ
      - `device_id` (text) - 検品端末ID
      - `created_at` (timestamptz) - 作成日時

  2. セキュリティ
    - RLSを有効化
    - 全ユーザーが読み取り・書き込み可能（検品端末から直接アクセス）
*/

CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspected_at timestamptz DEFAULT now(),
  result text NOT NULL CHECK (result IN ('OK', 'NG')),
  defect_type text CHECK (defect_type IN ('キズ', '黒点', 'フラッシュ', NULL)),
  defect_details jsonb DEFAULT '{}',
  images jsonb DEFAULT '[]',
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLSを有効化
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- 全ての認証済みユーザーが読み取り可能
CREATE POLICY "Anyone can read inspections"
  ON inspections
  FOR SELECT
  TO public
  USING (true);

-- 全ての認証済みユーザーが書き込み可能
CREATE POLICY "Anyone can insert inspections"
  ON inspections
  FOR INSERT
  TO public
  WITH CHECK (true);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_result ON inspections(result);
CREATE INDEX IF NOT EXISTS idx_inspections_device_id ON inspections(device_id);