import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AndroidProjectWorkspace } from './components/AndroidProjectWorkspace';
import { ArchitectureView } from './components/ArchitectureView';
import { EditingToolbar } from './components/EditingToolbar';
import { ExportModal } from './components/ExportModal';
import { MultiTrackTimeline } from './components/MultiTrackTimeline';
import { OfflineIndicator } from './components/PWAInstallButton';
import { ToolInspectorPanel } from './components/ToolInspectorPanel';
import { TopBar } from './components/TopBar';
import { VideoPreviewCanvas } from './components/VideoPreviewCanvas';
import {
  DEFAULT_COLOR_GRADING,
  INITIAL_AUDIO_CLIPS,
  INITIAL_CAPTIONS,
  INITIAL_OVERLAYS,
  INITIAL_VIDEO_CLIPS,
} from './data/initialProject';
import {
  AspectRatioMode,
  AudioClip,
  CaptionSegment,
  TextOverlay,
  ToolTabId,
  VideoClip,
  WorkspaceView,
} from './types/editor';
import { studioAudioEngine } from './utils/audioEngine';

function normalizeSequence(clips: VideoClip[]): VideoClip[] {
  let cursor = 0;
  return clips.map((clip) => {
    const safeDuration = Math.max(0.6, Number(clip.duration.toFixed(2)));
    const next: VideoClip = {
      ...clip,
      startTime: Number(cursor.toFixed(2)),
      duration: safeDuration,
    };
    cursor += safeDuration;
    return next;
  });
}

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('studio');
  const [videoClips, setVideoClips] = useState<VideoClip[]>(() =>
    normalizeSequence(INITIAL_VIDEO_CLIPS)
  );
  const [audioClips, setAudioClips] = useState<AudioClip[]>(INITIAL_AUDIO_CLIPS);
  const [overlays, setOverlays] = useState<TextOverlay[]>(INITIAL_OVERLAYS);
  const [captions, setCaptions] = useState<CaptionSegment[]>(INITIAL_CAPTIONS);

  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    INITIAL_VIDEO_CLIPS[0]?.id ?? null
  );
  const [activeTool, setActiveTool] = useState<ToolTabId>('cut_trim');
  const [playhead, setPlayhead] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('16:9');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playheadRef = useRef(playhead);
  const audioClipsRef = useRef(audioClips);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    audioClipsRef.current = audioClips;
  }, [audioClips]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const totalDuration = useMemo(() => {
    const end = videoClips.reduce(
      (max, clip) => Math.max(max, clip.startTime + clip.duration),
      0
    );
    return Math.max(1, Number(end.toFixed(2)));
  }, [videoClips]);

  // Playback loop via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      studioAudioEngine.stopPlayback();
      return;
    }

    studioAudioEngine.startPlayback(
      () => playheadRef.current,
      () => audioClipsRef.current,
      () => isMutedRef.current
    );

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;

      setPlayhead((prev) => {
        const next = prev + dt;
        if (next >= totalDuration) {
          return 0;
        }
        return Number(next.toFixed(3));
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      studioAudioEngine.stopPlayback();
    };
  }, [isPlaying, totalDuration]);

  const selectedClipIndex = useMemo(
    () => videoClips.findIndex((c) => c.id === selectedClipId),
    [videoClips, selectedClipId]
  );

  const selectedClip =
    selectedClipIndex >= 0 ? videoClips[selectedClipIndex] : null;

  const handleUpdateClip = useCallback(
    (clipId: string, updater: (clip: VideoClip) => VideoClip) => {
      setVideoClips((prev) =>
        normalizeSequence(prev.map((c) => (c.id === clipId ? updater(c) : c)))
      );
    },
    []
  );

  const handleSplitClip = useCallback(() => {
    if (!selectedClip) return;
    const localOffset = playhead - selectedClip.startTime;
    if (localOffset <= 0.4 || localOffset >= selectedClip.duration - 0.4) {
      // If playhead isn't strictly inside the selected clip, split at midpoint
      const mid = Number((selectedClip.duration / 2).toFixed(2));
      if (mid < 0.6) return;
      const firstHalf: VideoClip = {
        ...selectedClip,
        duration: mid,
      };
      const secondHalf: VideoClip = {
        ...selectedClip,
        id: `v-clip-${Date.now()}`,
        name: `${selectedClip.name} (Cut)`,
        trimStart: Number((selectedClip.trimStart + mid).toFixed(2)),
        duration: Number((selectedClip.duration - mid).toFixed(2)),
        transitionIn: 'none',
      };
      setVideoClips((prev) => {
        const idx = prev.findIndex((c) => c.id === selectedClip.id);
        if (idx < 0) return prev;
        const next = [...prev];
        next.splice(idx, 1, firstHalf, secondHalf);
        return normalizeSequence(next);
      });
      setSelectedClipId(secondHalf.id);
      return;
    }

    const firstHalf: VideoClip = {
      ...selectedClip,
      duration: Number(localOffset.toFixed(2)),
    };
    const secondHalf: VideoClip = {
      ...selectedClip,
      id: `v-clip-${Date.now()}`,
      name: `${selectedClip.name} (Cut)`,
      trimStart: Number((selectedClip.trimStart + localOffset).toFixed(2)),
      duration: Number((selectedClip.duration - localOffset).toFixed(2)),
      transitionIn: 'none',
    };

    setVideoClips((prev) => {
      const idx = prev.findIndex((c) => c.id === selectedClip.id);
      if (idx < 0) return prev;
      const next = [...prev];
      next.splice(idx, 1, firstHalf, secondHalf);
      return normalizeSequence(next);
    });
    setSelectedClipId(secondHalf.id);
  }, [selectedClip, playhead]);

  const handleMergeNext = useCallback(() => {
    if (selectedClipIndex < 0 || selectedClipIndex >= videoClips.length - 1) return;
    const current = videoClips[selectedClipIndex];
    const nextClip = videoClips[selectedClipIndex + 1];

    const merged: VideoClip = {
      ...current,
      name: `${current.name.replace(' (Cut)', '')} + Merge`,
      duration: Number((current.duration + nextClip.duration).toFixed(2)),
      sourceDuration: Math.max(current.sourceDuration, current.duration + nextClip.duration),
    };

    setVideoClips((prev) => {
      const copy = [...prev];
      copy.splice(selectedClipIndex, 2, merged);
      return normalizeSequence(copy);
    });
  }, [selectedClipIndex, videoClips]);

  const handleDeleteClip = useCallback(() => {
    if (!selectedClipId || videoClips.length <= 1) return;
    const remaining = videoClips.filter((c) => c.id !== selectedClipId);
    const normalized = normalizeSequence(remaining);
    setVideoClips(normalized);
    setSelectedClipId(normalized[0]?.id ?? null);
    setPlayhead(0);
  }, [selectedClipId, videoClips]);

  const handleMoveClip = useCallback(
    (direction: -1 | 1) => {
      const targetIdx = selectedClipIndex + direction;
      if (selectedClipIndex < 0 || targetIdx < 0 || targetIdx >= videoClips.length) return;
      setVideoClips((prev) => {
        const copy = [...prev];
        const [item] = copy.splice(selectedClipIndex, 1);
        copy.splice(targetIdx, 0, item);
        return normalizeSequence(copy);
      });
    },
    [selectedClipIndex, videoClips.length]
  );

  const handleTrimToPlayhead = useCallback(
    (side: 'left' | 'right') => {
      if (!selectedClip) return;
      const localOffset = playhead - selectedClip.startTime;
      if (localOffset <= 0.3 || localOffset >= selectedClip.duration - 0.3) return;

      handleUpdateClip(selectedClip.id, (clip) => {
        if (side === 'left') {
          return {
            ...clip,
            trimStart: Number((clip.trimStart + localOffset).toFixed(2)),
            duration: Number((clip.duration - localOffset).toFixed(2)),
          };
        }
        return {
          ...clip,
          duration: Number(localOffset.toFixed(2)),
        };
      });
    },
    [selectedClip, playhead, handleUpdateClip]
  );

  const handleImportVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const newClip: VideoClip = {
      id: `v-clip-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      mediaType: isVideo ? 'video' : 'image',
      src: url,
      startTime: totalDuration,
      duration: 5.0,
      sourceDuration: 15.0,
      trimStart: 0,
      speed: 1,
      transitionIn: 'dissolve',
      transitionDuration: 0.6,
      filterPreset: 'original',
      filterIntensity: 70,
      colorGrading: { ...DEFAULT_COLOR_GRADING },
    };

    if (isVideo) {
      const probe = document.createElement('video');
      probe.src = url;
      probe.onloadedmetadata = () => {
        const dur = Number(Math.min(30, Math.max(1.5, probe.duration || 5)).toFixed(2));
        setVideoClips((prev) =>
          normalizeSequence(
            prev.map((c) =>
              c.id === newClip.id ? { ...c, duration: dur, sourceDuration: probe.duration || dur } : c
            )
          )
        );
      };
    }

    setVideoClips((prev) => normalizeSequence([...prev, newClip]));
    setSelectedClipId(newClip.id);
  };

  const handleImportAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const bars = Array.from({ length: 48 }, (_, i) =>
      Number((0.25 + Math.abs(Math.sin(i * 0.6 + file.size)) * 0.7).toFixed(2))
    );
    const newAudio: AudioClip = {
      id: `a-clip-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      src: url,
      startTime: 0,
      duration: totalDuration,
      volume: 85,
      fadeIn: 0.4,
      fadeOut: 0.5,
      muted: false,
      waveform: bars,
    };
    setAudioClips((prev) => [...prev, newAudio]);
  };

  const handleAddSynthAudio = (
    preset: 'emerald_pulse' | 'neon_synth' | 'cinematic_sub',
    name: string
  ) => {
    const start = audioClips.reduce((acc, a) => Math.max(acc, a.startTime + a.duration), 0);
    const clampedStart = start >= totalDuration ? 0 : start;
    const dur = Math.max(3, totalDuration - clampedStart);
    const bars = Array.from({ length: 48 }, (_, i) =>
      Number((0.2 + Math.abs(Math.cos(i * 0.45 + preset.length)) * 0.75).toFixed(2))
    );
    setAudioClips((prev) => [
      ...prev,
      {
        id: `a-clip-${Date.now()}`,
        name,
        synthPreset: preset,
        startTime: Number(clampedStart.toFixed(2)),
        duration: Number(dur.toFixed(2)),
        volume: 82,
        fadeIn: 0.4,
        fadeOut: 0.6,
        muted: false,
        waveform: bars,
      },
    ]);
  };

  const handleGenerateCaptions = () => {
    const generated: CaptionSegment[] = videoClips.map((clip, idx) => ({
      id: `cap-gen-${clip.id}-${idx}`,
      text: `${clip.name} — ${
        clip.filterPreset === 'neon_pink'
          ? 'Neon Pink FX sequence in 4K motion.'
          : clip.filterPreset === 'emerald_cinema'
          ? 'Emerald cinema grade with precision timing.'
          : 'Color graded studio sequence.'
      }`,
      startTime: Number((clip.startTime + 0.3).toFixed(2)),
      endTime: Number(Math.max(clip.startTime + 0.9, clip.startTime + clip.duration - 0.3).toFixed(2)),
    }));
    setCaptions(generated);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F3F4F6] flex flex-col">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenExport={() => {
          setIsPlaying(false);
          setIsExportOpen(true);
        }}
      />

      {activeView === 'studio' && (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-4 flex flex-col gap-4">
          {/* Upper Workspace: Video Preview + Tool Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              <VideoPreviewCanvas
                clips={videoClips}
                overlays={overlays}
                captions={captions}
                playhead={playhead}
                totalDuration={totalDuration}
                isPlaying={isPlaying}
                isMuted={isMuted}
                aspectRatio={aspectRatio}
                canvasRef={canvasRef}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSeek={(t) => setPlayhead(t)}
                onToggleMute={() => setIsMuted((m) => !m)}
                onChangeAspectRatio={setAspectRatio}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col">
              <ToolInspectorPanel
                activeTool={activeTool}
                selectedClip={selectedClip}
                selectedClipIndex={selectedClipIndex}
                totalClipsCount={videoClips.length}
                playhead={playhead}
                overlays={overlays}
                audioClips={audioClips}
                captions={captions}
                onUpdateClip={handleUpdateClip}
                onSplitClip={handleSplitClip}
                onMergeNext={handleMergeNext}
                onMoveClip={handleMoveClip}
                onTrimToPlayhead={handleTrimToPlayhead}
                onAddOverlay={(ov) =>
                  setOverlays((prev) => [...prev, { ...ov, id: `ov-${Date.now()}` }])
                }
                onDeleteOverlay={(id) =>
                  setOverlays((prev) => prev.filter((o) => o.id !== id))
                }
                onAddSynthAudio={handleAddSynthAudio}
                onUpdateAudio={(id, updater) =>
                  setAudioClips((prev) => prev.map((a) => (a.id === id ? updater(a) : a)))
                }
                onDeleteAudio={(id) =>
                  setAudioClips((prev) => prev.filter((a) => a.id !== id))
                }
                onGenerateCaptions={handleGenerateCaptions}
                onUpdateCaption={(id, text) =>
                  setCaptions((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, text } : c))
                  )
                }
                onDeleteCaption={(id) =>
                  setCaptions((prev) => prev.filter((c) => c.id !== id))
                }
              />
            </div>
          </div>

          {/* Multi-Track Timeline */}
          <MultiTrackTimeline
            videoClips={videoClips}
            audioClips={audioClips}
            overlays={overlays}
            captions={captions}
            selectedClipId={selectedClipId}
            playhead={playhead}
            totalDuration={totalDuration}
            onSeek={(t) => {
              setIsPlaying(false);
              setPlayhead(t);
            }}
            onSelectClip={(id) => setSelectedClipId(id)}
            onSplitClip={handleSplitClip}
            onMergeNext={handleMergeNext}
            onDeleteClip={handleDeleteClip}
            onImportVideoFile={handleImportVideoFile}
            onImportAudioFile={handleImportAudioFile}
          />

          {/* Professional Editing Toolbar */}
          <EditingToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
          />
        </main>
      )}

      {activeView === 'android_project' && <AndroidProjectWorkspace />}
      {activeView === 'architecture' && <ArchitectureView />}

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasRef}
        clips={videoClips}
        totalDuration={totalDuration}
        onSeek={(t) => setPlayhead(t)}
        onStopPlayback={() => setIsPlaying(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
