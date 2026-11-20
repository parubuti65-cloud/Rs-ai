import React, { useRef, useState } from 'react';
import {
  Combine,
  Film,
  Music,
  Plus,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AudioClip,
  CaptionSegment,
  TextOverlay,
  VideoClip,
} from '../types/editor';
import { formatShortSeconds, formatTimecode } from '../utils/timecode';

interface MultiTrackTimelineProps {
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  overlays: TextOverlay[];
  captions: CaptionSegment[];
  selectedClipId: string | null;
  playhead: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string) => void;
  onSplitClip: () => void;
  onMergeNext: () => void;
  onDeleteClip: () => void;
  onImportVideoFile: (file: File) => void;
  onImportAudioFile: (file: File) => void;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  videoClips,
  audioClips,
  overlays,
  captions,
  selectedClipId,
  playhead,
  totalDuration,
  onSeek,
  onSelectClip,
  onSplitClip,
  onMergeNext,
  onDeleteClip,
  onImportVideoFile,
  onImportAudioFile,
}) => {
  const [pxPerSec, setPxPerSec] = useState<number>(48);
  const trackAreaRef = useRef<HTMLDivElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const timelineWidth = Math.max(760, Math.ceil((totalDuration + 4) * pxPerSec));
  const playheadLeft = Math.max(0, playhead * pxPerSec);

  const handleRulerPointer = (clientX: number) => {
    const container = trackAreaRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const offsetX = clientX - rect.left + container.scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, offsetX / pxPerSec));
    onSeek(Number(newTime.toFixed(2)));
  };

  const selectedIndex = videoClips.findIndex((c) => c.id === selectedClipId);
  const canMerge = selectedIndex >= 0 && selectedIndex < videoClips.length - 1;

  const ticks: number[] = [];
  const totalSecCeil = Math.ceil(totalDuration + 3);
  for (let s = 0; s <= totalSecCeil; s += 2) {
    ticks.push(s);
  }

  return (
    <section className="bg-[#101218] border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {/* Timeline Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-[#101218]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportVideoFile(file);
              e.target.value = '';
            }}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportAudioFile(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Add Media</span>
          </button>

          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Music className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Add Audio</span>
          </button>

          <span className="h-4 w-px bg-white/10 mx-1 hidden sm:inline-block" />

          <button
            type="button"
            onClick={onSplitClip}
            disabled={!selectedClipId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Scissors className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>Split</span>
          </button>

          <button
            type="button"
            onClick={onMergeNext}
            disabled={!canMerge}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Combine className="w-3.5 h-3.5 text-[#FF2E93]" />
            <span>Merge Next</span>
          </button>

          <button
            type="button"
            onClick={onDeleteClip}
            disabled={!selectedClipId || videoClips.length <= 1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171A23] hover:bg-red-500/20 disabled:opacity-40 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Delete</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono-tabular text-[11px] text-[#9CA3AF] hidden sm:inline">
            {formatTimecode(playhead)}
          </span>
          <button
            type="button"
            aria-label="Zoom out timeline"
            onClick={() => setPxPerSec((z) => Math.max(28, z - 12))}
            className="p-1.5 rounded-md bg-[#171A23] hover:bg-white/10 text-[#9CA3AF] hover:text-white border border-white/10 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom in timeline"
            onClick={() => setPxPerSec((z) => Math.min(96, z + 12))}
            className="p-1.5 rounded-md bg-[#171A23] hover:bg-white/10 text-[#9CA3AF] hover:text-white border border-white/10 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Track Body */}
      <div className="flex">
        {/* Track Headers Column */}
        <div className="w-24 sm:w-28 shrink-0 bg-[#0D0F14] border-r border-white/10 flex flex-col select-none">
          <div className="h-7 border-b border-white/10 px-2.5 flex items-center text-[11px] font-mono-tabular text-[#6B7280]">
            Time
          </div>
          <div className="h-14 border-b border-white/10 px-2.5 flex items-center gap-1.5 text-xs font-medium text-[#F3F4F6]">
            <Film className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="truncate">V1 Video</span>
          </div>
          <div className="h-10 border-b border-white/10 px-2.5 flex items-center text-[11px] font-medium text-[#9CA3AF]">
            V2 Overlays
          </div>
          <div className="h-12 border-b border-white/10 px-2.5 flex items-center text-[11px] font-medium text-[#9CA3AF]">
            A1 Audio
          </div>
          <div className="h-10 px-2.5 flex items-center text-[11px] font-medium text-[#9CA3AF]">
            CC Captions
          </div>
        </div>

        {/* Scrollable Track Canvas */}
        <div
          ref={trackAreaRef}
          className="relative flex-1 overflow-x-auto bg-[#08090C] select-none"
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative">
            {/* Time Ruler (Interactive Scrub) */}
            <div
              onPointerDown={(e) => handleRulerPointer(e.clientX)}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleRulerPointer(e.clientX);
              }}
              className="relative h-7 border-b border-white/10 bg-[#101218] cursor-ew-resize"
            >
              {ticks.map((sec) => (
                <div
                  key={sec}
                  style={{ left: `${sec * pxPerSec}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pb-1"
                >
                  <span className="font-mono-tabular text-[10px] text-[#6B7280] pl-1">
                    {sec}s
                  </span>
                  <div className="w-px h-1.5 bg-white/20" />
                </div>
              ))}
            </div>

            {/* V1 Video Track */}
            <div className="relative h-14 border-b border-white/10 flex items-center">
              {videoClips.map((clip) => {
                const isSelected = clip.id === selectedClipId;
                const left = clip.startTime * pxPerSec;
                const width = Math.max(36, clip.duration * pxPerSec);
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => {
                      onSelectClip(clip.id);
                      onSeek(clip.startTime);
                    }}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    className={`absolute top-1.5 bottom-1.5 rounded-md overflow-hidden flex items-center gap-2 px-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#171A23] ring-2 ring-[#10B981]'
                        : 'bg-[#171A23] border border-white/15 hover:border-white/30'
                    }`}
                  >
                    {clip.mediaType === 'image' ? (
                      <img
                        src={clip.src}
                        alt={clip.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-[#F3F4F6] truncate">
                        {clip.name}
                      </div>
                      <div className="text-[10px] font-mono-tabular text-[#9CA3AF]">
                        {formatShortSeconds(clip.duration)} · {clip.speed}x
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* V2 Overlays (Text & Stickers) */}
            <div className="relative h-10 border-b border-white/10">
              {overlays.map((ov) => (
                <button
                  key={ov.id}
                  type="button"
                  onClick={() => onSeek(ov.startTime)}
                  style={{
                    left: `${ov.startTime * pxPerSec}px`,
                    width: `${Math.max(48, ov.duration * pxPerSec)}px`,
                  }}
                  className="absolute top-1.5 bottom-1.5 rounded bg-[#FF2E93]/15 border border-[#FF2E93]/50 px-2 flex items-center text-[11px] font-medium text-[#F3F4F6] truncate cursor-pointer hover:bg-[#FF2E93]/25"
                >
                  <span className="truncate">{ov.content}</span>
                </button>
              ))}
            </div>

            {/* A1 Audio Track with Waveforms */}
            <div className="relative h-12 border-b border-white/10">
              {audioClips.map((audio) => {
                const width = Math.max(60, audio.duration * pxPerSec);
                return (
                  <button
                    key={audio.id}
                    type="button"
                    onClick={() => onSeek(audio.startTime)}
                    style={{
                      left: `${audio.startTime * pxPerSec}px`,
                      width: `${width}px`,
                    }}
                    className={`absolute top-1.5 bottom-1.5 rounded overflow-hidden px-2 flex flex-col justify-between cursor-pointer border ${
                      audio.muted
                        ? 'bg-white/5 border-white/15 opacity-50'
                        : 'bg-[#10B981]/12 border-[#10B981]/45 hover:bg-[#10B981]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] text-[#F3F4F6] pt-0.5">
                      <span className="truncate font-medium">{audio.name}</span>
                      <span className="font-mono-tabular text-[#10B981] shrink-0 ml-2">
                        {audio.volume}%
                      </span>
                    </div>
                    <div className="flex items-end gap-[2px] h-4 w-full pb-0.5">
                      {audio.waveform.slice(0, 48).map((amp, i) => (
                        <span
                          key={i}
                          style={{ height: `${Math.max(15, amp * 100)}%` }}
                          className={`flex-1 rounded-t-[1px] ${
                            i % 7 === 0 ? 'bg-[#FF6B2C]' : 'bg-[#10B981]'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CC Auto Captions Track */}
            <div className="relative h-10">
              {captions.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => onSeek(cap.startTime)}
                  style={{
                    left: `${cap.startTime * pxPerSec}px`,
                    width: `${Math.max(48, (cap.endTime - cap.startTime) * pxPerSec)}px`,
                  }}
                  className="absolute top-1.5 bottom-1.5 rounded bg-[#FF6B2C]/14 border border-[#FF6B2C]/45 px-2 flex items-center text-[10px] text-[#F3F4F6] truncate cursor-pointer hover:bg-[#FF6B2C]/24"
                >
                  <span className="truncate">{cap.text}</span>
                </button>
              ))}
            </div>

            {/* Vertical Playhead Line */}
            <div
              style={{ left: `${playheadLeft}px` }}
              className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-[#FF6B2C] z-20"
            >
              <div className="w-3 h-3 -ml-[5px] bg-[#FF6B2C] rotate-45 -mt-1 rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
