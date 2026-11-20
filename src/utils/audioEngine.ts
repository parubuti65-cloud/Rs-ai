import { AudioClip } from '../types/editor';

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private stepTimer: number | null = null;
  private htmlAudioElements: Map<string, HTMLAudioElement> = new Map();
  private currentStep = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public startPlayback(getPlayhead: () => number, getClips: () => AudioClip[], isMuted: () => boolean) {
    this.stopPlayback();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stepTimer = window.setInterval(() => {
      const time = getPlayhead();
      const clips = getClips();
      const muted = isMuted();

      const activeClip = clips.find(
        (c) => !c.muted && time >= c.startTime && time <= c.startTime + c.duration
      );

      if (!activeClip || muted) {
        this.pauseAllHtmlAudio();
        return;
      }

      const masterVolume = (activeClip.volume / 100) * 0.16;

      if (activeClip.src) {
        let el = this.htmlAudioElements.get(activeClip.id);
        if (!el) {
          el = new Audio(activeClip.src);
          this.htmlAudioElements.set(activeClip.id, el);
        }
        el.volume = Math.min(1, activeClip.volume / 100);
        const targetOffset = Math.max(0, time - activeClip.startTime);
        if (Math.abs(el.currentTime - targetOffset) > 0.35) {
          el.currentTime = targetOffset;
        }
        if (el.paused) {
          void el.play().catch(() => {});
        }
      } else {
        this.pauseAllHtmlAudio();
        this.triggerSynthStep(ctx, activeClip.synthPreset ?? 'emerald_pulse', masterVolume);
      }
    }, 240);
  }

  private triggerSynthStep(
    ctx: AudioContext,
    preset: 'emerald_pulse' | 'neon_synth' | 'cinematic_sub',
    volume: number
  ) {
    if (!this.gainNode) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const stepGain = ctx.createGain();

    const emeraldScale = [110, 130.81, 164.81, 196, 220, 164.81, 130.81, 146.83];
    const neonScale = [146.83, 174.61, 220, 261.63, 293.66, 220, 196, 174.61];
    const subScale = [73.42, 82.41, 98, 110, 82.41, 73.42, 65.41, 73.42];

    const notes =
      preset === 'neon_synth' ? neonScale : preset === 'cinematic_sub' ? subScale : emeraldScale;
    const freq = notes[this.currentStep % notes.length];
    this.currentStep += 1;

    osc.type = preset === 'neon_synth' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    stepGain.gain.setValueAtTime(0.001, now);
    stepGain.gain.exponentialRampToValueAtTime(Math.max(0.002, volume), now + 0.04);
    stepGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);

    osc.connect(stepGain);
    stepGain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  private pauseAllHtmlAudio() {
    this.htmlAudioElements.forEach((audio) => {
      if (!audio.paused) audio.pause();
    });
  }

  public stopPlayback() {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    this.pauseAllHtmlAudio();
  }
}

export const studioAudioEngine = new StudioAudioEngine();
