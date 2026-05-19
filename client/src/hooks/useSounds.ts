import { useRef, useCallback } from 'react';

type SoundType = 'place' | 'draw' | 'pass' | 'win' | 'lose' | 'click' | 'join' | 'error';

function createBeep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.3
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playPlaceSound(ctx: AudioContext): void {
  // Satisfying "clack" sound
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1;
  gain.gain.value = 0.5;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  // Small pitch accent
  createBeep(ctx, 880, 0.05, 'square', 0.1);
}

export function useSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback(
    (sound: SoundType) => {
      try {
        const ctx = getCtx();
        switch (sound) {
          case 'place':
            playPlaceSound(ctx);
            break;
          case 'draw':
            createBeep(ctx, 440, 0.15, 'triangle', 0.2);
            setTimeout(() => createBeep(ctx, 550, 0.1, 'triangle', 0.15), 80);
            break;
          case 'pass':
            createBeep(ctx, 300, 0.2, 'sine', 0.15);
            break;
          case 'win':
            [523, 659, 784, 1047].forEach((freq, i) => {
              setTimeout(() => createBeep(ctx, freq, 0.3, 'sine', 0.3), i * 100);
            });
            break;
          case 'lose':
            [523, 440, 349].forEach((freq, i) => {
              setTimeout(() => createBeep(ctx, freq, 0.3, 'triangle', 0.2), i * 150);
            });
            break;
          case 'click':
            createBeep(ctx, 600, 0.05, 'square', 0.1);
            break;
          case 'join':
            createBeep(ctx, 660, 0.1, 'sine', 0.2);
            setTimeout(() => createBeep(ctx, 880, 0.15, 'sine', 0.2), 100);
            break;
          case 'error':
            createBeep(ctx, 200, 0.2, 'sawtooth', 0.2);
            break;
        }
      } catch {
        // Audio not available, ignore
      }
    },
    [getCtx]
  );

  return { play };
}
