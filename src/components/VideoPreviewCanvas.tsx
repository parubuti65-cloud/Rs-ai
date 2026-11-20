import React, { useEffect, useRef } from 'react';
import {
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AspectRatioMode,
  CaptionSegment,
  FilterPresetId,
  TextOverlay,
  VideoClip,
} from '../types/editor';
import { formatTimecode } from '../utils/timecode';

interface VideoPreviewCanvasProps {
  clips: VideoClip[];
  overlays: TextOverlay[];
  captions: CaptionSegment[];
  playhead: number;
  totalDuration: number;
  isPlaying: boolean;
  isMuted: boolean;
  aspectRatio: AspectRatioMode;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onChangeAspectRatio: (mode: AspectRatioMode) => void;
}

function buildCanvasFilterString(clip: VideoClip): string {
  const g = clip.colorGrading;
  const intensity = clip.filterIntensity / 100;

  let brightness = 1 + g.exposure / 100;
  let contrast = 1 + g.contrast / 100;
  let saturate = 1 + g.saturation / 100;
  let hueRotate = 0;
  let sepia = Math.max(0, g.temperature) / 140;

  const preset: FilterPresetId = clip.filterPreset;
  if (preset === 'emerald_cinema') {
    contrast += 0.12 * intensity;
    saturate += 0.15 * intensity;
    hueRotate -= 8 * intensity;
  } else if (preset === 'neon_pink') {
    contrast += 0.18 * intensity;
    saturate += 0.45 * intensity;
    hueRotate -= 16 * intensity;
  } else if (preset === 'sunset_orange') {
    sepia += 0.25 * intensity;
    saturate += 0.25 * intensity;
    brightness += 0.04 * intensity;
  } else if (preset === 'noir_contrast') {
    saturate = Math.max(0, 1 - 0.95 * intensity);
    contrast += 0.28 * intensity;
  } else if (preset === 'cyber_vivid') {
    contrast += 0.22 * intensity;
    saturate += 0.5 * intensity;
  }

  return `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)}) hue-rotate(${hueRotate.toFixed(1)}deg) sepia(${sepia.toFixed(2)})`;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  clips,
  overlays,
  captions,
  playhead,
  totalDuration,
  isPlaying,
  isMuted,
  aspectRatio,
  canvasRef,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onChangeAspectRatio,
}) => {
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Preload clip media elements
  useEffect(() => {
    clips.forEach((clip) => {
      if (clip.mediaType === 'image') {
        if (!imageCacheRef.current.has(clip.src)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = clip.src;
          imageCacheRef.current.set(clip.src, img);
        }
      } else if (clip.mediaType === 'video') {
        if (!videoCacheRef.current.has(clip.src)) {
          const vid = document.createElement('video');
          vid.crossOrigin = 'anonymous';
          vid.src = clip.src;
          vid.muted = true;
          vid.playsInline = true;
          vid.preload = 'auto';
          videoCacheRef.current.set(clip.src, vid);
        }
      }
    });
  }, [clips]);

  // Draw current frame to Canvas whenever state updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 960;
    const targetHeight = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 960;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    // Clear studio obsidian background
    ctx.fillStyle = '#08090C';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const activeIndex = clips.findIndex(
      (c) => playhead >= c.startTime && playhead <= c.startTime + c.duration
    );
    const activeClip = activeIndex >= 0 ? clips[activeIndex] : clips[clips.length - 1];
    const prevClip = activeIndex > 0 ? clips[activeIndex - 1] : null;

    if (!activeClip) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Import a video or image to start editing', targetWidth / 2, targetHeight / 2);
      return;
    }

    const localTime = Math.max(0, playhead - activeClip.startTime);
    const progressInClip = activeClip.duration > 0 ? Math.min(1, localTime / activeClip.duration) : 0;

    const drawMediaClip = (
      clip: VideoClip,
      clipLocalTime: number,
      alpha: number,
      offsetX = 0
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = buildCanvasFilterString(clip);

      const scaleFactor =
        clip.mediaType === 'image'
          ? 1 + (clipLocalTime / Math.max(1, clip.duration)) * 0.08 * clip.speed
          : 1;

      if (clip.mediaType === 'video') {
        const vid = videoCacheRef.current.get(clip.src);
        if (vid && vid.readyState >= 2) {
          const desiredTime = Math.min(
            vid.duration || clip.sourceDuration,
            clip.trimStart + clipLocalTime * clip.speed
          );
          if (Math.abs(vid.currentTime - desiredTime) > 0.15) {
            vid.currentTime = desiredTime;
          }
          drawCoverFrame(ctx, vid, vid.videoWidth || 1280, vid.videoHeight || 720, targetWidth, targetHeight, scaleFactor, offsetX);
        }
      } else {
        const img = imageCacheRef.current.get(clip.src);
        if (img && img.complete && img.naturalWidth > 0) {
          drawCoverFrame(ctx, img, img.naturalWidth, img.naturalHeight, targetWidth, targetHeight, scaleFactor, offsetX);
        }
      }

      ctx.restore();

      // Temperature cool/warm overlay
      if (clip.colorGrading.temperature !== 0) {
        ctx.save();
        ctx.globalAlpha = Math.abs(clip.colorGrading.temperature) / 280;
        ctx.fillStyle = clip.colorGrading.temperature > 0 ? '#FF6B2C' : '#38BDF8';
        ctx.fillRect(offsetX, 0, targetWidth, targetHeight);
        ctx.restore();
      }

      // Neon Pink / Emerald FX overlays
      if (clip.filterPreset === 'neon_pink' || clip.filterPreset === 'cyber_vivid') {
        ctx.save();
        const grad = ctx.createRadialGradient(
          targetWidth * 0.5,
          targetHeight * 0.5,
          targetWidth * 0.18,
          targetWidth * 0.5,
          targetHeight * 0.5,
          targetWidth * 0.72
        );
        grad.addColorStop(0, 'rgba(255, 46, 147, 0)');
        grad.addColorStop(1, `rgba(255, 46, 147, ${(0.24 * (clip.filterIntensity / 100)).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.restore();
      } else if (clip.filterPreset === 'emerald_cinema') {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = `rgba(16, 185, 129, ${(0.18 * (clip.filterIntensity / 100)).toFixed(2)})`;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.restore();
      }
    };

    // Handle Transition In
    const transDur = activeClip.transitionDuration;
    const inTransition = activeClip.transitionIn !== 'none' && localTime < transDur && transDur > 0;

    if (inTransition) {
      const t = Math.min(1, localTime / transDur);
      if (activeClip.transitionIn === 'fade_black') {
        drawMediaClip(activeClip, localTime, t);
      } else if (activeClip.transitionIn === 'dissolve' && prevClip) {
        drawMediaClip(prevClip, prevClip.duration, 1 - t);
        drawMediaClip(activeClip, localTime, t);
      } else if (activeClip.transitionIn === 'slide_left' && prevClip) {
        drawMediaClip(prevClip, prevClip.duration, 1, -targetWidth * t);
        drawMediaClip(activeClip, localTime, 1, targetWidth * (1 - t));
      } else if (activeClip.transitionIn === 'neon_glitch') {
        const jitter = Math.sin(localTime * 65) * 18 * (1 - t);
        drawMediaClip(activeClip, localTime, 1, jitter);
        ctx.save();
        ctx.globalAlpha = 0.35 * (1 - t);
        ctx.fillStyle = '#FF2E93';
        ctx.fillRect(0, targetHeight * ((localTime * 5) % 0.8), targetWidth, 16);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(0, targetHeight * ((localTime * 3.7) % 0.85), targetWidth, 8);
        ctx.restore();
      } else {
        drawMediaClip(activeClip, localTime, 1);
      }
    } else {
      drawMediaClip(activeClip, localTime, 1);
    }

    // Vignette from Color Grading
    if (activeClip.colorGrading.vignette > 0) {
      ctx.save();
      const vigAlpha = (activeClip.colorGrading.vignette / 100) * 0.72;
      const vig = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.25,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.75
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(8,9,12,${vigAlpha.toFixed(2)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();
    }

    // Subtle letterbox framing cue during Ken Burns
    void progressInClip;

    // Draw Active Text & Sticker Overlays
    const activeOverlays = overlays.filter(
      (ov) => playhead >= ov.startTime && playhead <= ov.startTime + ov.duration
    );
    activeOverlays.forEach((ov) => {
      const x = (ov.xPercent / 100) * targetWidth;
      const y = (ov.yPercent / 100) * targetHeight;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (ov.kind === 'sticker') {
        ctx.font = `700 ${Math.round(ov.fontSize * 0.9)}px "Outfit", sans-serif`;
        const metrics = ctx.measureText(ov.content);
        const padX = 18;
        const boxW = metrics.width + padX * 2;
        const boxH = ov.fontSize + 18;
        ctx.fillStyle = 'rgba(8, 9, 12, 0.84)';
        ctx.strokeStyle = ov.color;
        ctx.lineWidth = 2.5;
        roundRect(ctx, x - boxW / 2, y - boxH / 2, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ov.color;
        ctx.fillText(ov.content, x, y);
      } else {
        ctx.font = `700 ${ov.fontSize}px "Outfit", sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.75)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = ov.color;
        ctx.fillText(ov.content, x, y);
      }
      ctx.restore();
    });

    // Draw Active Auto Caption with contrast scrim
    const activeCaption = captions.find(
      (cap) => playhead >= cap.startTime && playhead <= cap.endTime
    );
    if (activeCaption) {
      ctx.save();
      const fontSize = aspectRatio === '9:16' ? 28 : 26;
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      const maxTextW = targetWidth * 0.82;
      const words = activeCaption.text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      words.forEach((word) => {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxTextW) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      });
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.35;
      const boxH = lines.length * lineHeight + 20;
      const boxW = Math.min(
        maxTextW + 36,
        Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36
      );
      const boxY = targetHeight - boxH - 36;
      const boxX = (targetWidth - boxW) / 2;

      ctx.fillStyle = 'rgba(8, 9, 12, 0.84)';
      roundRect(ctx, boxX, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, idx) => {
        ctx.fillStyle = '#F3F4F6';
        ctx.fillText(line, targetWidth / 2, boxY + 12 + lineHeight * (idx + 0.5));
      });
      ctx.restore();
    }
  }, [clips, overlays, captions, playhead, aspectRatio, canvasRef]);

  const activeClip = clips.find(
    (c) => playhead >= c.startTime && playhead <= c.startTime + c.duration
  );

  return (
    <section className="flex flex-col bg-[#101218] border border-white/10 rounded-xl overflow-hidden">
      {/* Preview Viewport Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] truncate">
          <span className="font-medium text-[#F3F4F6]">Live Preview</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{activeClip ? activeClip.name : 'Empty Sequence'}</span>
          {activeClip && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-[#10B981]">{activeClip.speed}x</span>
            </>
          )}
        </div>

        {/* Aspect Ratio Segmented Switch */}
        <div className="flex items-center gap-1 bg-[#08090C] p-0.5 rounded-lg border border-white/10 shrink-0">
          {(['16:9', '9:16', '1:1'] as AspectRatioMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeAspectRatio(mode)}
              className={`px-2.5 py-1 text-[11px] font-mono-tabular rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                aspectRatio === mode
                  ? 'bg-[#171A23] text-[#10B981] font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Stage */}
      <div className="relative bg-[#08090C] flex items-center justify-center p-3 sm:p-4 min-h-[260px] lg:min-h-[340px]">
        <canvas
          ref={canvasRef}
          className={`rounded-lg border border-white/10 shadow-2xl max-h-[360px] w-auto object-contain ${
            aspectRatio === '9:16'
              ? 'aspect-[9/16]'
              : aspectRatio === '1:1'
              ? 'aspect-square'
              : 'aspect-video max-w-full'
          }`}
        />
      </div>

      {/* Transport Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-white/10 bg-[#101218]">
        <div className="flex items-center gap-2 font-mono-tabular text-xs">
          <span className="text-[#10B981] font-semibold">{formatTimecode(playhead)}</span>
          <span className="text-[#6B7280]">/</span>
          <span className="text-[#9CA3AF]">{formatTimecode(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Jump to start"
            onClick={() => onSeek(0)}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#08090C] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            aria-label="Step forward 1 second"
            onClick={() => onSeek(Math.min(totalDuration, playhead + 1))}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            onClick={onToggleMute}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#FF2E93]" /> : <Volume2 className="w-4 h-4 text-[#10B981]" />}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono-tabular text-[#6B7280]">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>30 FPS</span>
          </span>
        </div>
      </div>
    </section>
  );
};

function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  scaleFactor: number,
  offsetX: number
) {
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;
  let drawW = dstW;
  let drawH = dstH;

  if (srcRatio > dstRatio) {
    drawH = dstH * scaleFactor;
    drawW = drawH * srcRatio;
  } else {
    drawW = dstW * scaleFactor;
    drawH = drawW / srcRatio;
  }

  const dx = offsetX + (dstW - drawW) / 2;
  const dy = (dstH - drawH) / 2;
  ctx.drawImage(source, dx, dy, drawW, drawH);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
