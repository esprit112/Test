
export interface UsageStats {
  promptTokens: number;
  candidatesTokens: number;
  cost: number;
}

export interface RestorationStep {
  id: string;
  type: 'physical' | 'chemical' | 'digital';
  description: string;
  priority: 'high' | 'medium' | 'low';
  tool: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface SubjectAnalysis {
  count: number;
  gender: 'Male' | 'Female' | 'Mixed' | 'Unknown';
  ageGroup: 'Infant' | 'Child' | 'Teenager' | 'Young Adult' | 'Adult' | 'Middle-Aged' | 'Elderly' | 'Unknown';
  description?: string;
}

export interface DetectedObject {
  object: string;
  category: string;
  location: string;
}

export interface Defect {
  type: string;
  label?: string;
  location?: string;
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  severity: string;
}

export interface DamageAnalysis {
  historicalEra: string;
  materialSubstrate: string;
  conditionRating: number;
  geolocation?: string;
  groundingLinks?: { uri: string; title: string }[];
  visualResearch?: string; // Historical context found via Google Search
  subjects?: SubjectAnalysis[];
  detectedObjects?: DetectedObject[];
  defects: Defect[];
  restorationPlan: RestorationStep[];
  auditFocus?: 'general' | 'colour' | 'defects';
  usage?: UsageStats; // Added usage tracking for analysis stage
}

export interface ProjectImage {
  id: string;
  filename: string;
  displayFilename: string;
  originalPath: string;
  analysedPath?: string; 
  restoredPath?: string;
  status: 'uploaded' | 'analyzed' | 'restoring' | 'completed' | 'failed';
  thumbnailUrl: string; 
  analysis?: DamageAnalysis;
  restorationReport?: string;
  userContext?: string;
  usage?: {
    analysis?: UsageStats;
    restoration?: UsageStats;
    refinement?: UsageStats;
    totalTokens: number;
    totalCost: number;
  };
}

export interface ProjectStats {
  total: number;
  uploaded: number;
  analyzed: number;
  restored: number;
  totalTokens?: number;
  totalCost?: number;
}

export interface Project {
  id: string;
  clientName: string;
  title: string;
  createdAt: string;
  status: 'active' | 'archived';
  images: ProjectImage[];
  stats?: ProjectStats;
  summary?: string;
}

export enum AppStage {
  DASHBOARD = 'DASHBOARD',
  PROJECT_WORKSPACE = 'PROJECT_WORKSPACE',
}

export enum WorkspaceStage {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW_PLAN = 'REVIEW_PLAN',
  RESTORING = 'RESTORING',
  COMPARE = 'COMPARE',
}

export enum TrustLevel {
  FOUNDATION = 'Foundation (Original)',
  CONSERVATION = 'Conservation (Cleaning)',
  RESTORATION = 'Restoration (Inpainting)',
  RECONSTRUCTION = 'Reconstruction (AI Gen)',
}

export interface LoadingStates {
  processing: boolean;
  uploading: boolean;
  analyzing: boolean;
  restoring: boolean;
  [key: string]: boolean;
}

export class APIError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}
