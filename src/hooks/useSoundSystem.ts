import { useRef, useCallback } from 'react';

export type SoundMode = 'off' | 'tick' | 'noise' | 'both';
export type NoiseType = 'white' | 'brown' | 'pink' | 'rain' | 'wind' | 'ocean';

export const NOISE_OPTIONS: { id: NoiseType; label: string; icon: string; desc: string }[] = [
  { id: 'white', label: 'ضوضاء بيضاء', icon: '📡', desc: 'تردد متساوٍ لجميع الأصوات' },
  { id: 'brown', label: 'ضوضاء بنية',  icon: '🟫', desc: 'أعمق وأدفأ من البيضاء' },
  { id: 'pink',  label: 'ضوضاء وردية', icon: '🌸', desc: 'متوازنة وطبيعية للتركيز' },
  { id: 'rain',  label: 'مطر',          icon: '🌧️', desc: 'صوت المطر الهادئ' },
  { id: 'wind',  label: 'ريح',          icon: '🌬️', desc: 'نسيم خفيف متأرجح' },
  { id: 'ocean', label: 'أمواج البحر',  icon: '🌊', desc: 'أمواج تتلاطم بإيقاع بطيء' },
];

export function useSoundSystem() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);       // master gain for fade in/out
  const sourcesRef = useRef<AudioScheduledSourceNode[]>([]); // all running sources to stop
  const tickCount = useRef(0);

  // ── audio context ──────────────────────────────────────────────────────────
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // ── noise buffer generators ────────────────────────────────────────────────
  function makeWhiteBuffer(c: AudioContext, secs = 4) {
    const n = c.sampleRate * secs;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function makeBrownBuffer(c: AudioContext, secs = 4) {
    const n = c.sampleRate * secs;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  function makePinkBuffer(c: AudioContext, secs = 4) {
    const n = c.sampleRate * secs;
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  // ── start noise ────────────────────────────────────────────────────────────
  const startNoise = useCallback((type: NoiseType = 'brown', volume = 0.12) => {
    const c = getCtx();
    if (masterRef.current) return; // already running

    const master = c.createGain();
    master.gain.setValueAtTime(0, c.currentTime);
    master.gain.linearRampToValueAtTime(volume, c.currentTime + 1.5);
    master.connect(c.destination);
    masterRef.current = master;

    const track = (src: AudioScheduledSourceNode, ...chain: AudioNode[]) => {
      let prev: AudioNode = src;
      chain.forEach(n => { prev.connect(n); prev = n; });
      prev.connect(master);
      src.start();
      sourcesRef.current.push(src);
    };

    if (type === 'white') {
      const src = c.createBufferSource();
      src.buffer = makeWhiteBuffer(c);
      src.loop = true;
      track(src);

    } else if (type === 'brown') {
      const src = c.createBufferSource();
      src.buffer = makeBrownBuffer(c);
      src.loop = true;
      const lpf = c.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 500;
      track(src, lpf);

    } else if (type === 'pink') {
      const src = c.createBufferSource();
      src.buffer = makePinkBuffer(c);
      src.loop = true;
      const lpf = c.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 3000;
      track(src, lpf);

    } else if (type === 'rain') {
      // Layer 1: base hiss (high-pass white noise)
      const src1 = c.createBufferSource();
      src1.buffer = makeWhiteBuffer(c, 6);
      src1.loop = true;
      const hpf = c.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 1800;
      const g1 = c.createGain(); g1.gain.value = 0.6;
      track(src1, hpf, g1);

      // Layer 2: mid-range drizzle
      const src2 = c.createBufferSource();
      src2.buffer = makePinkBuffer(c, 6);
      src2.loop = true;
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 3500; bpf.Q.value = 0.8;
      const g2 = c.createGain(); g2.gain.value = 0.4;
      track(src2, bpf, g2);

      // LFO for natural intensity variation (0.3 Hz)
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.3;
      const lfoGain = c.createGain(); lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain); lfoGain.connect(master.gain);
      lfo.start(); sourcesRef.current.push(lfo);

    } else if (type === 'wind') {
      const src = c.createBufferSource();
      src.buffer = makeBrownBuffer(c, 6);
      src.loop = true;
      const lpf = c.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 300;
      const g = c.createGain(); g.gain.value = 1;

      // Slow swell LFO (0.05 Hz ≈ 20-second cycle)
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoGain = c.createGain(); lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain); lfoGain.connect(master.gain);
      lfo.start(); sourcesRef.current.push(lfo);

      track(src, lpf, g);

    } else if (type === 'ocean') {
      const src = c.createBufferSource();
      src.buffer = makeBrownBuffer(c, 8);
      src.loop = true;
      const lpf = c.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 700;

      // Wave LFO at ~0.12 Hz (one wave every ~8 seconds)
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = c.createGain(); lfoGain.gain.value = 0.07;
      lfo.connect(lfoGain); lfoGain.connect(master.gain);
      lfo.start(); sourcesRef.current.push(lfo);

      // Second wave layer offset by half phase for depth
      const lfo2 = c.createOscillator();
      lfo2.frequency.value = 0.08;
      const lfoGain2 = c.createGain(); lfoGain2.gain.value = 0.04;
      lfo2.connect(lfoGain2); lfoGain2.connect(master.gain);
      lfo2.start(); sourcesRef.current.push(lfo2);

      track(src, lpf);
    }
  }, [getCtx]);

  // ── stop noise ─────────────────────────────────────────────────────────────
  const stopNoise = useCallback(() => {
    const c = ctxRef.current;
    if (!c || !masterRef.current) return;

    const master = masterRef.current;
    master.gain.setValueAtTime(master.gain.value, c.currentTime);
    master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);

    const srcs = [...sourcesRef.current];
    setTimeout(() => srcs.forEach(s => { try { s.stop(); } catch {} }), 900);

    masterRef.current = null;
    sourcesRef.current = [];
  }, []);

  // ── tick-tock ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const c = getCtx();
    const isTick = tickCount.current % 2 === 0;
    tickCount.current++;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = isTick ? 1000 : 700;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, c.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.04);
  }, [getCtx]);

  // ── completion bell ────────────────────────────────────────────────────────
  const bell = useCallback(() => {
    const c = getCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = c.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t); osc.stop(t + 1.2);
    });
  }, [getCtx]);

  const resetTickCount = useCallback(() => { tickCount.current = 0; }, []);

  return { tick, startNoise, stopNoise, bell, resetTickCount };
}
