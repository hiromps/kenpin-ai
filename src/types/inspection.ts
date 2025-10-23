export type InspectionResult = 'OK' | 'NG';

export type DefectType = 'キズ' | '黒点' | 'フラッシュ';

export interface CapturedImage {
  faceNumber: number;
  dataUrl: string;
  timestamp: number;
}

export interface DefectDetail {
  type: DefectType;
  confidence: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Inspection {
  id: string;
  inspected_at: string;
  result: InspectionResult;
  defect_type: DefectType | null;
  defect_details: DefectDetail[];
  images: CapturedImage[];
  device_id: string;
  created_at: string;
}

export interface InspectionStats {
  total: number;
  ok: number;
  ng: number;
  okRate: number;
}

export interface DefectSample {
  id: string;
  type: DefectType;
  name: string;
  imageDataUrl: string;
  createdAt: number;
}
