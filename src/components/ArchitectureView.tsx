import React from 'react';
import {
  Captions,
  Combine,
  Cpu,
  Download,
  Gauge,
  Layers,
  Music,
  Palette,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Type,
  Video,
} from 'lucide-react';

const TECH_STACK = [
  {
    name: 'Kotlin',
    role: 'Primary Language & Coroutines',
    detail:
      'Type-safe MVI state management with Kotlin Coroutines and StateFlow coordinating timeline edits, scrubbing, and async render jobs.',
    accent: '#10B981',
    icon: Cpu,
  },
  {
    name: 'Jetpack Compose',
    role: 'Declarative Studio Interface',
    detail:
      'Hardware-accelerated Canvas timeline tracks, audio waveform bars, bottom toolbars, and Material 3 dark studio surfaces.',
    accent: '#FF2E93',
    icon: Layers,
  },
  {
    name: 'FFmpeg',
    role: 'Filter Graph & 4K Export Engine',
    detail:
      'Multi-input filter_complex pipeline powering frame-accurate trim, xfade transitions, eq color grading, setpts speed ramps, and H.265 4K rendering.',
    accent: '#FF6B2C',
    icon: Video,
  },
  {
    name: 'Android Media APIs',
    role: 'Media3 ExoPlayer & MediaExtractor',
    detail:
      'Zero-latency ExoPlayer preview surface paired with MediaExtractor PCM waveform sampling and MediaCodec hardware encoding.',
    accent: '#10B981',
    icon: Music,
  },
];

const EDITING_FEATURES = [
  { title: 'Video Cut & Trim', desc: 'Frame-accurate in/out trim points on V1 tracks', icon: Scissors },
  { title: 'Split & Merge', desc: 'Instant playhead razor split and adjacent clip merge', icon: Combine },
  { title: 'Transitions', desc: 'Cross dissolve, dip to black, kinetic wipe, and neon glitch', icon: Sparkles },
  { title: 'Filters & Effects', desc: 'Emerald Cinema, Neon Pink FX, Orange Grade, and Noir', icon: Palette },
  { title: 'Text & Stickers', desc: 'Timed title overlays and crisp vector studio badges', icon: Type },
  { title: 'Music & Audio', desc: 'Multi-track audio mixing with live waveform visualization', icon: Music },
  { title: 'Auto Captions', desc: 'Synced timed captions with high-contrast scrim overlay', icon: Captions },
  { title: 'Speed Control', desc: '0.25x slow-motion up to 4.0x hyper-lapse speed ramps', icon: Gauge },
  { title: 'Color Grading', desc: 'Exposure, contrast, saturation, temperature, and vignette', icon: SlidersHorizontal },
  { title: '4K Export', desc: '1080P, 2K, and 4K UHD master output at up to 60 FPS', icon: Download },
];

const BRAND_SWATCHES = [
  { name: 'Premium Black UI', hex: '#08090C', role: '60% Studio Canvas & Preview Stage' },
  { name: 'Emerald Green Highlights', hex: '#10B981', role: 'Active Clips, Transport & Waveform Core' },
  { name: 'Neon Pink Effects', hex: '#FF2E93', role: 'FX Transitions, Overlay Track & Filters' },
  { name: 'Orange Accent', hex: '#FF6B2C', role: 'Playhead Scrubber, Split Actions & 4K Export CTA' },
];

export const ArchitectureView: React.FC = () => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-8 flex flex-col gap-10">
      {/* Section 1: Technology Stack */}
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Core Technology Architecture
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Native Android video engineering stack uniting real-time Jetpack Compose preview with FFmpeg 4K rendering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TECH_STACK.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="bg-[#101218] border border-white/10 rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-white">
                    {tech.name}
                  </span>
                  <span style={{ color: tech.accent }}>
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <div className="text-xs font-medium" style={{ color: tech.accent }}>
                  {tech.role}
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{tech.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: 10 Editing Features */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Studio Editing Capabilities
          </h2>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Every editing workflow is active in both the live browser studio and the downloadable Android Studio codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {EDITING_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-[#101218] border border-white/10 rounded-xl p-4 flex flex-col gap-2"
              >
                <Icon className="w-4 h-4 text-[#10B981]" />
                <div className="text-sm font-semibold text-[#F3F4F6]">{feat.title}</div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: RS Premium Branding Palette */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            RS Premium Branding System
          </h2>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Calibrated dark-room color hierarchy designed for zero eye fatigue during long color grading sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BRAND_SWATCHES.map((swatch) => (
            <div
              key={swatch.name}
              className="bg-[#101218] border border-white/10 rounded-xl p-4 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-lg border border-white/20 shrink-0"
                style={{ backgroundColor: swatch.hex }}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{swatch.name}</div>
                <div className="font-mono-tabular text-[11px] text-[#10B981] mt-0.5">
                  {swatch.hex}
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-0.5 line-clamp-2">
                  {swatch.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
