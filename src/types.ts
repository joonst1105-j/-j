export interface TrendingVideo {
  id: string;
  title: string;
  creator: string;
  views: string;
  platform: "Shorts" | "Reels" | "TikTok" | string;
  category: string;
  videoUrl: string;
  productName: string;
  searchQuery: string;
  points: string[];
  thumbnail: string;
}

export interface RealTimeTrendItem {
  name: string;
  reason: string;
  hook: string;
  score: number;
  query: string;
}

export interface ScriptScene {
  sceneNumber: number;
  visual: string;
  narration: string;
  durationSec: number;
}

export interface ScriptSet {
  title: string;
  duration: string;
  scenes: ScriptScene[];
}

export interface AnalysisResult {
  productName: string;
  keySellingPoints: string[];
  targetAudience: string;
  hooks: string[];
  scripts: ScriptSet[];
  tips: string[];
}
