export interface GenerationResponse {
  text: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FileData {
  file: File;
  previewUrl?: string;
}