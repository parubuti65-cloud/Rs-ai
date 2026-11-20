export type ToolTabId =
  | 'cut_trim'
  | 'split_merge'
  | 'transitions'
  | 'filters'
  | 'text_stickers'
  | 'music_audio'
  | 'auto_captions'
  | 'speed'
  | 'color_grading';

export type WorkspaceView = 'studio' | 'android_project' | 'architecture';

export type TransitionType = 'none' | 'dissolve' | 'fade_black' | 'slide_left' | 'neon_glitch';

export type FilterPresetId =
  | 'original'
  | 'neon_pink'
  | 'emerald_cinema'
  | 'sunset_orange'
  | 'noir_contrast'
  | 'cyber_vivid';

export type AspectRatioMode = '16:9' | '9:16' | '1:1';

export interface ColorGrading {
  exposure: number;    // -50 to 50
  contrast: number;    // -50 to 50
  saturation: number;  // -50 to 50
  temperature: number; // -50 to 50
  vignette: number;    // 0 to 100
}

export interface VideoClip {
  id: string;
  name: string;
  mediaType: 'image' | 'video';
  src: string;
  startTime: number;      // timeline start in seconds
  duration: number;       // visible duration on timeline in seconds
  sourceDuration: number; // total source duration in seconds
  trimStart: number;      // seconds trimmed from source start
  speed: number;          // 0.25 to 4.0
  transitionIn: TransitionType;
  transitionDuration: number;
  filterPreset: FilterPresetId;
  filterIntensity: number; // 0 to 100
  colorGrading: ColorGrading;
}

export interface AudioClip {
  id: string;
  name: string;
  src?: string;           // optional uploaded audio blob URL
  synthPreset?: 'emerald_pulse' | 'neon_synth' | 'cinematic_sub';
  startTime: number;
  duration: number;
  volume: number;         // 0 to 100
  fadeIn: number;         // seconds
  fadeOut: number;        // seconds
  muted: boolean;
  waveform: number[];     // normalized 0..1 bar heights
}

export interface TextOverlay {
  id: string;
  kind: 'text' | 'sticker';
  content: string;        // text string or sticker key
  startTime: number;
  duration: number;
  xPercent: number;       // 0..100
  yPercent: number;       // 0..100
  fontSize: number;       // px at 1080p reference
  color: string;
  backgroundColor?: string;
}

export interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  highlightWord?: string;
}

export type ExportResolution = '1080p' | '2k' | '4k';

export interface ExportConfig {
  resolution: ExportResolution;
  fps: 24 | 30 | 60;
  codec: 'H.264' | 'H.265 HEVC' | 'WebM VP9';
  bitrateMbps: number;
}

export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'gradle' | 'xml' | 'toml' | 'markdown';
  category: 'Gradle & Build' | 'Manifest & Resources' | 'Theme & Branding' | 'Domain & Engine' | 'Compose UI';
  description: string;
  content: string;
}
