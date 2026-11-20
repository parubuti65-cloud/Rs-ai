import {
  AudioClip,
  CaptionSegment,
  ColorGrading,
  FilterPresetId,
  TextOverlay,
  TransitionType,
  VideoClip,
} from '../types/editor';

export const DEFAULT_COLOR_GRADING: ColorGrading = {
  exposure: 0,
  contrast: 8,
  saturation: 10,
  temperature: 0,
  vignette: 18,
};

export const FILTER_PRESETS: {
  id: FilterPresetId;
  label: string;
  accent: string;
  description: string;
}[] = [
  { id: 'original', label: 'Original', accent: '#9CA3AF', description: 'Neutral camera color profile' },
  { id: 'emerald_cinema', label: 'Emerald Cinema', accent: '#10B981', description: 'Deep shadows with rich emerald midtones' },
  { id: 'neon_pink', label: 'Neon Pink FX', accent: '#FF2E93', description: 'Chromatic magenta highlights & luminous edge glow' },
  { id: 'sunset_orange', label: 'Orange Grade', accent: '#FF6B2C', description: 'Warm amber highlights and golden contrast' },
  { id: 'noir_contrast', label: 'Obsidian Noir', accent: '#E5E7EB', description: 'High-contrast monochrome studio look' },
  { id: 'cyber_vivid', label: 'Dual Tone FX', accent: '#10B981', description: 'Emerald + Neon Pink split-toning' },
];

export const TRANSITION_OPTIONS: {
  id: TransitionType;
  label: string;
  description: string;
}[] = [
  { id: 'none', label: 'Hard Cut', description: 'Direct frame-accurate cut' },
  { id: 'dissolve', label: 'Cross Dissolve', description: 'Smooth alpha blend between clips' },
  { id: 'fade_black', label: 'Dip to Black', description: 'Fade through pure studio black' },
  { id: 'slide_left', label: 'Kinetic Wipe', description: 'Horizontal directional push transition' },
  { id: 'neon_glitch', label: 'Neon Pink Glitch', description: 'RGB split & neon flash transition' },
];

export const STICKER_OPTIONS: {
  id: string;
  label: string;
  symbol: string;
  color: string;
}[] = [
  { id: 'rs_pro_badge', label: 'RS PRO Stamp', symbol: 'RS PRO', color: '#10B981' },
  { id: 'rec_4k', label: '4K Master', symbol: '4K HDR', color: '#FF6B2C' },
  { id: 'neon_bolt', label: 'FX Bolt', symbol: '⚡ FX', color: '#FF2E93' },
  { id: 'cinema_frame', label: 'Cinema Scope', symbol: '24FPS', color: '#F3F4F6' },
];

function buildWaveform(seed: number, length = 64): number[] {
  const bars: number[] = [];
  for (let i = 0; i < length; i++) {
    const wave =
      Math.abs(Math.sin((i + seed) * 0.42)) * 0.55 +
      Math.abs(Math.cos((i * 1.7 + seed) * 0.23)) * 0.35 +
      0.1;
    bars.push(Math.min(1, Number(wave.toFixed(2))));
  }
  return bars;
}

export const INITIAL_VIDEO_CLIPS: VideoClip[] = [
  {
    id: 'v-clip-1',
    name: 'Coastal Twilight Drive',
    mediaType: 'image',
    src: '/src/assets/images/clip_neon_cityscape_1795194964905.jpg',
    startTime: 0,
    duration: 5.5,
    sourceDuration: 12,
    trimStart: 0,
    speed: 1,
    transitionIn: 'fade_black',
    transitionDuration: 0.6,
    filterPreset: 'emerald_cinema',
    filterIntensity: 75,
    colorGrading: { ...DEFAULT_COLOR_GRADING },
  },
  {
    id: 'v-clip-2',
    name: 'Emerald Ridge Aerial',
    mediaType: 'image',
    src: '/src/assets/images/clip_emerald_aerial_1795194963894.jpg',
    startTime: 5.5,
    duration: 5.5,
    sourceDuration: 12,
    trimStart: 0,
    speed: 1,
    transitionIn: 'dissolve',
    transitionDuration: 0.8,
    filterPreset: 'sunset_orange',
    filterIntensity: 65,
    colorGrading: { ...DEFAULT_COLOR_GRADING, temperature: 12 },
  },
  {
    id: 'v-clip-3',
    name: 'Stage Motion Study',
    mediaType: 'image',
    src: '/src/assets/images/clip_studio_dancer_1795194963955.jpg',
    startTime: 11,
    duration: 5.0,
    sourceDuration: 12,
    trimStart: 0,
    speed: 1,
    transitionIn: 'neon_glitch',
    transitionDuration: 0.6,
    filterPreset: 'neon_pink',
    filterIntensity: 80,
    colorGrading: { ...DEFAULT_COLOR_GRADING, contrast: 18 },
  },
];

export const INITIAL_AUDIO_CLIPS: AudioClip[] = [
  {
    id: 'a-clip-1',
    name: 'Emerald Pulse Score',
    synthPreset: 'emerald_pulse',
    startTime: 0,
    duration: 10.5,
    volume: 82,
    fadeIn: 0.8,
    fadeOut: 0.5,
    muted: false,
    waveform: buildWaveform(1),
  },
  {
    id: 'a-clip-2',
    name: 'Neon Pink Kinetic Drop',
    synthPreset: 'neon_synth',
    startTime: 10.5,
    duration: 5.5,
    volume: 88,
    fadeIn: 0.4,
    fadeOut: 1.0,
    muted: false,
    waveform: buildWaveform(7),
  },
];

export const INITIAL_OVERLAYS: TextOverlay[] = [
  {
    id: 'ov-1',
    kind: 'text',
    content: 'NIGHT HORIZON CUT',
    startTime: 0.6,
    duration: 4.2,
    xPercent: 50,
    yPercent: 22,
    fontSize: 54,
    color: '#FFFFFF',
  },
  {
    id: 'ov-2',
    kind: 'sticker',
    content: 'RS PRO',
    startTime: 11.4,
    duration: 4.0,
    xPercent: 82,
    yPercent: 16,
    fontSize: 28,
    color: '#10B981',
  },
];

export const INITIAL_CAPTIONS: CaptionSegment[] = [
  {
    id: 'cap-1',
    text: 'Frame-accurate multi-track editing engineered for mobile 4K workflows.',
    startTime: 0.5,
    endTime: 4.8,
    highlightWord: 'multi-track',
  },
  {
    id: 'cap-2',
    text: 'Color graded with dynamic temperature curves and smooth cross dissolves.',
    startTime: 5.8,
    endTime: 10.2,
    highlightWord: 'Color graded',
  },
  {
    id: 'cap-3',
    text: 'Neon Pink effects and hardware-accelerated FFmpeg 4K rendering.',
    startTime: 11.2,
    endTime: 15.6,
    highlightWord: 'Neon Pink',
  },
];
