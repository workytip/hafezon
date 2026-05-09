import { useRef, useCallback } from 'react';

export type SoundMode = 'off' | 'tick' | 'noise' | 'both';

export function useSoundSystem() {
  const ctxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const tickCount = useRef(0);

  const ctx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // short click: odd ticks are higher pitched (tick), even are lower (tock)
  const tick = useCallback(() => {
    const c = ctx();
    const isTick = tickCount.current % 2 === 0;
    tickCount.current++;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sine';
    osc.frequency.value = isTick ? 1000 : 700;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, c.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.04);
  }, [ctx]);

  // gentle brown-ish noise (white noise + lowpass filter)
  const startNoise = useCallback((volume = 0.06) => {
    const c = ctx();
    if (noiseRef.current) return; // already running

    const sampleRate = c.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = c.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // brownian noise: integrate white noise
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = c.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start();

    // fade in
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + 1.5);

    noiseRef.current = source;
    noiseGainRef.current = gain;
  }, [ctx]);

  const stopNoise = useCallback(() => {
    if (!noiseRef.current || !noiseGainRef.current) return;
    const c = ctxRef.current;
    if (!c) return;

    const gain = noiseGainRef.current;
    gain.gain.setValueAtTime(gain.gain.value, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);

    const src = noiseRef.current;
    setTimeout(() => {
      try { src.stop(); } catch {}
    }, 900);

    noiseRef.current = null;
    noiseGainRef.current = null;
  }, []);

  // pleasant ascending C-E-G bell chord
  const bell = useCallback(() => {
    const c = ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  }, [ctx]);

  const resetTickCount = useCallback(() => { tickCount.current = 0; }, []);

  return { tick, startNoise, stopNoise, bell, resetTickCount };
}
