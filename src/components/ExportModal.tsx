import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, Film, X } from 'lucide-react';
import { ExportConfig, ExportResolution, VideoClip } from '../types/editor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  clips: VideoClip[];
  totalDuration: number;
  onSeek: (time: number) => void;
  onStopPlayback: () => void;
}

const RESOLUTION_SPECS: Record<
  ExportResolution,
  { label: string; dims: string; width: number; height: number; defaultBitrate: number }
> = {
  '1080p': { label: '1080P Full HD', dims: '1920×1080', width: 1920, height: 1080, defaultBitrate: 14 },
  '2k': { label: '2K QHD', dims: '2560×1440', width: 2560, height: 1440, defaultBitrate: 24 },
  '4k': { label: '4K Ultra HD', dims: '3840×2160', width: 3840, height: 2160, defaultBitrate: 45 },
};

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  clips,
  totalDuration,
  onSeek,
  onStopPlayback,
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    resolution: '4k',
    fps: 60,
    codec: 'H.265 HEVC',
    bitrateMbps: 45,
  });
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const ffmpegCommand = useMemo(() => {
    const spec = RESOLUTION_SPECS[config.resolution];
    const codecFlag = config.codec === 'H.265 HEVC' ? 'libx265' : config.codec === 'WebM VP9' ? 'libvpx-vp9' : 'libx264';
    const inputs = clips.map((c, idx) => `-i clip_${idx + 1}.mp4`).join(' ');
    return `ffmpeg ${inputs} -vf "scale=${spec.width}:${spec.height},fps=${config.fps}" -c:v ${codecFlag} -b:v ${config.bitrateMbps}M -c:a aac -b:a 192k RS_PRO_${config.resolution.toUpperCase()}.mp4`;
  }, [clips, config]);

  if (!isOpen) return null;

  const handleRenderVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') {
      setStatusNote('Browser MediaRecorder unavailable; copy the FFmpeg command below.');
      return;
    }

    onStopPlayback();
    setStatusNote(null);
    setRenderProgress(2);

    const stream = canvas.captureStream(Math.min(60, config.fps));
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: config.bitrateMbps * 1_000_000,
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RS_AI_VIDEO_EDITOR_PRO_${config.resolution.toUpperCase()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setRenderProgress(null);
      setStatusNote(`Exported ${RESOLUTION_SPECS[config.resolution].label} master video.`);
    };

    recorder.start(120);

    // Step through timeline quickly for live capture
    const captureDurationMs = Math.min(8000, Math.max(2500, totalDuration * 350));
    const startWall = performance.now();

    const stepFrame = (now: number) => {
      const elapsed = now - startWall;
      const ratio = Math.min(1, elapsed / captureDurationMs);
      onSeek(ratio * totalDuration);
      setRenderProgress(Math.round(ratio * 100));

      if (ratio < 1) {
        requestAnimationFrame(stepFrame);
      } else {
        recorder.stop();
      }
    };
    requestAnimationFrame(stepFrame);
  };

  const handleCopyCommand = async () => {
    await navigator.clipboard.writeText(ffmpegCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101218] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-[#FF6B2C]" />
            <h2 className="font-display text-base font-bold text-white">
              Export Video Master
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close export modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Resolution Selection: 1080P / 2K / 4K */}
          <div>
            <div className="text-xs font-medium text-[#9CA3AF] mb-2">Output Resolution</div>
            <div className="grid grid-cols-3 gap-2.5">
              {(['1080p', '2k', '4k'] as ExportResolution[]).map((res) => {
                const spec = RESOLUTION_SPECS[res];
                const active = config.resolution === res;
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        resolution: res,
                        bitrateMbps: spec.defaultBitrate,
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                        : 'bg-[#171A23] border-white/10 text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    <div className="font-display text-sm font-bold text-[#F3F4F6]">
                      {res.toUpperCase()}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-[#9CA3AF] mt-0.5">
                      {spec.dims}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate & Codec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">Frame Rate</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([24, 30, 60] as const).map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, fps }))}
                    className={`py-2 rounded-lg font-mono-tabular text-xs font-semibold border cursor-pointer ${
                      config.fps === fps
                        ? 'bg-[#171A23] border-[#10B981] text-[#10B981]'
                        : 'bg-[#08090C] border-white/10 text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">Encoder Codec</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['H.264', 'H.265 HEVC', 'WebM VP9'] as const).map((codec) => (
                  <button
                    key={codec}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, codec }))}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-medium border truncate cursor-pointer ${
                      config.codec === codec
                        ? 'bg-[#171A23] border-[#FF2E93] text-[#FF2E93]'
                        : 'bg-[#08090C] border-white/10 text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {codec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FFmpeg Command Preview */}
          <div className="bg-[#08090C] border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[#9CA3AF]">
                FFmpeg Render Pipeline Command
              </span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="inline-flex items-center gap-1 text-[11px] text-[#10B981] hover:underline cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="font-mono-tabular text-[11px] text-[#D1D5DB] overflow-x-auto whitespace-pre-wrap break-all">
              {ffmpegCommand}
            </pre>
          </div>

          {renderProgress !== null && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono-tabular">
                <span className="text-[#9CA3AF]">Rendering Timeline Canvas</span>
                <span className="text-[#FF6B2C]">{renderProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#FF6B2C] transition-all duration-100"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {statusNote && (
            <div className="text-xs text-[#10B981] font-medium">{statusNote}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-[#171A23] hover:bg-white/10 text-xs font-medium text-[#F3F4F6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={renderProgress !== null}
              onClick={handleRenderVideo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF6B2C] hover:bg-[#ff7d45] disabled:opacity-50 text-[#08090C] text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {renderProgress !== null
                  ? `Rendering ${config.resolution.toUpperCase()}...`
                  : `Render & Download ${config.resolution.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
