export interface PhotoSpec {
  id: string;
  name: string;
  nameUrdu: string;
  category: string;
  width: number;
  height: number;
  dpi: number;
  maxSizeKB: number;
  bgColor: string;
  description: string;
  flag?: string;
}

export interface ProcessedPhoto {
  id: string;
  originalName: string;
  spec: PhotoSpec;
  dataUrl: string;
  width: number;
  height: number;
  sizeKB: number;
  timestamp: number;
}

export interface StatsData {
  totalProcessed: number;
  todayProcessed: number;
  sessionProcessed: number;
  totalDownloads: number;
}
