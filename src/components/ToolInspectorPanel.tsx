import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Captions,
  Combine,
  Plus,
  RotateCcw,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DEFAULT_COLOR_GRADING,
  FILTER_PRESETS,
  STICKER_OPTIONS,
  TRANSITION_OPTIONS,
} from '../data/initialProject';
import {
  AudioClip,
  CaptionSegment,
  ColorGrading,
  FilterPresetId,
  TextOverlay,
  ToolTabId,
  TransitionType,
  VideoClip,
} from '../types/editor';
import { formatShortSeconds, formatTimecode } from '../utils/timecode';

interface ToolInspectorPanelProps {
  activeTool: ToolTabId;
  selectedClip: VideoClip | null;
  selectedClipIndex: number;
  totalClipsCount: number;
  playhead: number;
  overlays: TextOverlay[];
  audioClips: AudioClip[];
  captions: CaptionSegment[];
  onUpdateClip: (clipId: string, updater: (clip: VideoClip) => VideoClip) => void;
  onSplitClip: () => void;
  onMergeNext: () => void;
  onMoveClip: (direction: -1 | 1) => void;
  onTrimToPlayhead: (side: 'left' | 'right') => void;
  onAddOverlay: (overlay: Omit<TextOverlay, 'id'>) => void;
  onDeleteOverlay: (id: string) => void;
  onAddSynthAudio: (preset: 'emerald_pulse' | 'neon_synth' | 'cinematic_sub', name: string) => void;
  onUpdateAudio: (id: string, updater: (audio: AudioClip) => AudioClip) => void;
  onDeleteAudio: (id: string) => void;
  onGenerateCaptions: () => void;
  onUpdateCaption: (id: string, text: string) => void;
  onDeleteCaption: (id: string) => void;
}

export const ToolInspectorPanel: React.FC<ToolInspectorPanelProps> = ({
  activeTool,
  selectedClip,
  selectedClipIndex,
  totalClipsCount,
  playhead,
  overlays,
  audioClips,
  captions,
  onUpdateClip,
  onSplitClip,
  onMergeNext,
  onMoveClip,
  onTrimToPlayhead,
  onAddOverlay,
  onDeleteOverlay,
  onAddSynthAudio,
  onUpdateAudio,
  onDeleteAudio,
  onGenerateCaptions,
  onUpdateCaption,
  onDeleteCaption,
}) => {
  const [newText, setNewText] = useState('RS STUDIO PRO');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newTextSize, setNewTextSize] = useState(48);

  const updateGrading = (key: keyof ColorGrading, value: number) => {
    if (!selectedClip) return;
    onUpdateClip(selectedClip.id, (c) => ({
      ...c,
      colorGrading: { ...c.colorGrading, [key]: value },
    }));
  };

  return (
    <aside className="bg-[#101218] border border-white/10 rounded-xl p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-[#F3F4F6]">
            {getToolHeading(activeTool)}
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {selectedClip ? `Active clip: ${selectedClip.name}` : 'Select a clip on V1 timeline'}
          </p>
        </div>
        {selectedClip && (
          <span className="font-mono-tabular text-xs text-[#10B981]">
            {formatShortSeconds(selectedClip.duration)}
          </span>
        )}
      </div>

      {/* 1. CUT & TRIM */}
      {activeTool === 'cut_trim' && selectedClip && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onTrimToPlayhead('left')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Trim Start Here</span>
            </button>
            <button
              type="button"
              onClick={() => onTrimToPlayhead('right')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-[#FF6B2C]" />
              <span>Trim End Here</span>
            </button>
          </div>

          <SliderControl
            label="Clip Duration"
            value={selectedClip.duration}
            min={0.8}
            max={selectedClip.sourceDuration}
            step={0.1}
            unit="s"
            onChange={(val) =>
              onUpdateClip(selectedClip.id, (c) => ({ ...c, duration: val }))
            }
          />

          <SliderControl
            label="In-Point Offset"
            value={selectedClip.trimStart}
            min={0}
            max={Math.max(0, selectedClip.sourceDuration - 1)}
            step={0.1}
            unit="s"
            onChange={(val) =>
              onUpdateClip(selectedClip.id, (c) => ({ ...c, trimStart: val }))
            }
          />
        </div>
      )}

      {/* 2. SPLIT & MERGE */}
      {activeTool === 'split_merge' && selectedClip && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Move the orange playhead over a clip on V1 to split it into two independent segments, or merge adjacent clips together.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSplitClip}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#08090C] text-xs font-bold cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>Split at {formatTimecode(playhead)}</span>
            </button>

            <button
              type="button"
              onClick={onMergeNext}
              disabled={selectedClipIndex < 0 || selectedClipIndex >= totalClipsCount - 1}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#FF2E93] hover:opacity-90 disabled:opacity-35 text-white text-xs font-bold cursor-pointer"
            >
              <Combine className="w-4 h-4" />
              <span>Merge With Next</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs font-medium text-[#9CA3AF] mb-2">Clip Sequence Order</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={selectedClipIndex <= 0}
                onClick={() => onMoveClip(-1)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 disabled:opacity-35 border border-white/10 text-xs text-[#F3F4F6] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Move Earlier</span>
              </button>
              <button
                type="button"
                disabled={selectedClipIndex < 0 || selectedClipIndex >= totalClipsCount - 1}
                onClick={() => onMoveClip(1)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 disabled:opacity-35 border border-white/10 text-xs text-[#F3F4F6] cursor-pointer"
              >
                <span>Move Later</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRANSITIONS */}
      {activeTool === 'transitions' && selectedClip && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2">
            {TRANSITION_OPTIONS.map((opt) => {
              const active = selectedClip.transitionIn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onUpdateClip(selectedClip.id, (c) => ({
                      ...c,
                      transitionIn: opt.id as TransitionType,
                    }))
                  }
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#FF2E93]/15 border-[#FF2E93] text-white'
                      : 'bg-[#171A23] border-white/10 text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-[#F3F4F6]">{opt.label}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{opt.description}</div>
                  </div>
                  {active && <span className="text-[11px] font-mono-tabular text-[#FF2E93]">Active</span>}
                </button>
              );
            })}
          </div>

          <SliderControl
            label="Transition Duration"
            value={selectedClip.transitionDuration}
            min={0.2}
            max={1.5}
            step={0.1}
            unit="s"
            onChange={(val) =>
              onUpdateClip(selectedClip.id, (c) => ({ ...c, transitionDuration: val }))
            }
          />
        </div>
      )}

      {/* 4. FILTERS & EFFECTS */}
      {activeTool === 'filters' && selectedClip && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((preset) => {
              const active = selectedClip.filterPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onUpdateClip(selectedClip.id, (c) => ({
                      ...c,
                      filterPreset: preset.id as FilterPresetId,
                    }))
                  }
                  className={`px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#171A23] border-[#10B981] text-white'
                      : 'bg-[#171A23] border-white/10 text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F3F4F6]">{preset.label}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-1">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>

          <SliderControl
            label="Effect Intensity"
            value={selectedClip.filterIntensity}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(val) =>
              onUpdateClip(selectedClip.id, (c) => ({ ...c, filterIntensity: val }))
            }
          />
        </div>
      )}

      {/* 5. TEXT & STICKERS */}
      {activeTool === 'text_stickers' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#9CA3AF]">Title Text</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter overlay text..."
                className="flex-1 bg-[#08090C] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10B981]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newText.trim()) return;
                  onAddOverlay({
                    kind: 'text',
                    content: newText.trim(),
                    startTime: playhead,
                    duration: 3.5,
                    xPercent: 50,
                    yPercent: 26,
                    fontSize: newTextSize,
                    color: newTextColor,
                  });
                }}
                className="px-3 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#08090C] text-xs font-bold cursor-pointer shrink-0"
              >
                Add Text
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                {['#FFFFFF', '#10B981', '#FF2E93', '#FF6B2C'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Color ${hex}`}
                    onClick={() => setNewTextColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-5 h-5 rounded-full cursor-pointer ${
                      newTextColor === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-[#101218]' : ''
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#9CA3AF]">
                <span>Size</span>
                <input
                  type="range"
                  min={28}
                  max={78}
                  value={newTextSize}
                  onChange={(e) => setNewTextSize(Number(e.target.value))}
                  className="studio-slider w-20"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-xs font-medium text-[#9CA3AF] mb-2">Studio Stickers</div>
            <div className="grid grid-cols-2 gap-2">
              {STICKER_OPTIONS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    onAddOverlay({
                      kind: 'sticker',
                      content: st.symbol,
                      startTime: playhead,
                      duration: 3.5,
                      xPercent: 80,
                      yPercent: 18,
                      fontSize: 28,
                      color: st.color,
                    })
                  }
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs cursor-pointer"
                >
                  <span className="font-medium text-[#F3F4F6]">{st.label}</span>
                  <span className="font-mono-tabular font-bold" style={{ color: st.color }}>
                    {st.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
            {overlays.map((ov) => (
              <div
                key={ov.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#08090C] border border-white/10 text-xs"
              >
                <span className="truncate text-[#F3F4F6]">{ov.content}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-tabular text-[11px] text-[#9CA3AF]">
                    {formatShortSeconds(ov.startTime)}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove overlay"
                    onClick={() => onDeleteOverlay(ov.id)}
                    className="text-[#9CA3AF] hover:text-[#FF2E93] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MUSIC & AUDIO */}
      {activeTool === 'music_audio' && (
        <div className="flex flex-col gap-3">
          <div className="text-xs font-medium text-[#9CA3AF]">Add Studio Score</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onAddSynthAudio('emerald_pulse', 'Emerald Pulse')}
              className="px-2 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-[#10B981]/40 text-[11px] font-medium text-[#10B981] cursor-pointer"
            >
              + Emerald Beat
            </button>
            <button
              type="button"
              onClick={() => onAddSynthAudio('neon_synth', 'Neon Synth')}
              className="px-2 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-[#FF2E93]/40 text-[11px] font-medium text-[#FF2E93] cursor-pointer"
            >
              + Neon Synth
            </button>
            <button
              type="button"
              onClick={() => onAddSynthAudio('cinematic_sub', 'Sub Bass')}
              className="px-2 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-[#FF6B2C]/40 text-[11px] font-medium text-[#FF6B2C] cursor-pointer"
            >
              + Sub Drone
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pt-1">
            {audioClips.map((audio) => (
              <div
                key={audio.id}
                className="p-2.5 rounded-lg bg-[#08090C] border border-white/10 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#F3F4F6] truncate">{audio.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAudio(audio.id, (a) => ({ ...a, muted: !a.muted }))
                      }
                      className="p-1 text-[#9CA3AF] hover:text-white cursor-pointer"
                    >
                      {audio.muted ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#FF2E93]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAudio(audio.id)}
                      className="p-1 text-[#9CA3AF] hover:text-[#FF2E93] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <SliderControl
                  label="Volume"
                  value={audio.volume}
                  min={0}
                  max={100}
                  step={2}
                  unit="%"
                  onChange={(val) =>
                    onUpdateAudio(audio.id, (a) => ({ ...a, volume: val }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AUTO CAPTIONS */}
      {activeTool === 'auto_captions' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGenerateCaptions}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#FF6B2C] hover:bg-[#ff7d45] text-[#08090C] text-xs font-bold cursor-pointer"
          >
            <Captions className="w-4 h-4" />
            <span>Auto-Generate Sequence Captions</span>
          </button>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {captions.map((cap) => (
              <div
                key={cap.id}
                className="p-2.5 rounded-lg bg-[#08090C] border border-white/10 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#9CA3AF]">
                  <span>
                    {formatShortSeconds(cap.startTime)} - {formatShortSeconds(cap.endTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteCaption(cap.id)}
                    className="text-[#9CA3AF] hover:text-[#FF2E93] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={cap.text}
                  onChange={(e) => onUpdateCaption(cap.id, e.target.value)}
                  className="bg-[#171A23] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. SPEED CONTROL */}
      {activeTool === 'speed' && selectedClip && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[0.25, 0.5, 1, 1.5, 2, 4].map((spd) => {
              const active = selectedClip.speed === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() =>
                    onUpdateClip(selectedClip.id, (c) => ({ ...c, speed: spd }))
                  }
                  className={`py-2 rounded-lg font-mono-tabular text-xs font-semibold border cursor-pointer ${
                    active
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'bg-[#171A23] border-white/10 text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              );
            })}
          </div>

          <SliderControl
            label="Custom Playback Speed"
            value={selectedClip.speed}
            min={0.25}
            max={4}
            step={0.05}
            unit="x"
            onChange={(val) =>
              onUpdateClip(selectedClip.id, (c) => ({ ...c, speed: val }))
            }
          />
        </div>
      )}

      {/* 9. COLOR GRADING */}
      {activeTool === 'color_grading' && selectedClip && (
        <div className="flex flex-col gap-3">
          <SliderControl
            label="Exposure"
            value={selectedClip.colorGrading.exposure}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => updateGrading('exposure', val)}
          />
          <SliderControl
            label="Contrast"
            value={selectedClip.colorGrading.contrast}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => updateGrading('contrast', val)}
          />
          <SliderControl
            label="Saturation"
            value={selectedClip.colorGrading.saturation}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => updateGrading('saturation', val)}
          />
          <SliderControl
            label="Temperature"
            value={selectedClip.colorGrading.temperature}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => updateGrading('temperature', val)}
          />
          <SliderControl
            label="Vignette"
            value={selectedClip.colorGrading.vignette}
            min={0}
            max={100}
            step={2}
            unit="%"
            onChange={(val) => updateGrading('vignette', val)}
          />

          <button
            type="button"
            onClick={() =>
              onUpdateClip(selectedClip.id, (c) => ({
                ...c,
                colorGrading: { ...DEFAULT_COLOR_GRADING },
              }))
            }
            className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Color Grade</span>
          </button>
        </div>
      )}

      {!selectedClip &&
        activeTool !== 'text_stickers' &&
        activeTool !== 'music_audio' &&
        activeTool !== 'auto_captions' && (
          <div className="text-xs text-[#9CA3AF] py-6 text-center">
            Select any video clip on the V1 track to adjust {getToolHeading(activeTool)}.
          </div>
        )}
    </aside>
  );
};

function getToolHeading(tool: ToolTabId): string {
  switch (tool) {
    case 'cut_trim':
      return 'Cut & Trim';
    case 'split_merge':
      return 'Split & Merge';
    case 'transitions':
      return 'Transitions';
    case 'filters':
      return 'Filters & Effects';
    case 'text_stickers':
      return 'Text & Stickers';
    case 'music_audio':
      return 'Music & Audio';
    case 'auto_captions':
      return 'Auto Captions';
    case 'speed':
      return 'Speed Control';
    case 'color_grading':
      return 'Color Grading';
  }
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="font-mono-tabular text-[#F3F4F6]">
        {Number.isInteger(step) ? value : value.toFixed(2)}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="studio-slider w-full"
    />
  </div>
);
