import type { SoundPreset } from '@/types/rhythm';

export interface SoundOption {
  value: SoundPreset;
  label: string;
}

interface PartialTone {
  frequencyRatio: number;
  gain: number;
  decayRatio: number;
}

interface SoundProfile {
  frequencyHz: number;
  decayPerSecond: number;
  durationSeconds: number;
  amplitude: number;
  partials: readonly PartialTone[];
}

export const SOUND_OPTIONS: readonly SoundOption[] = [
  { value: 'wood', label: 'Wood' },
  { value: 'beep', label: 'Beep' },
  { value: 'bell', label: 'Bell' },
  { value: 'soft', label: 'Soft' },
];

const SOUND_PROFILES: Record<SoundPreset, SoundProfile> = {
  wood: {
    frequencyHz: 1_480,
    decayPerSecond: 210,
    durationSeconds: 0.07,
    amplitude: 0.82,
    partials: [
      { frequencyRatio: 1, gain: 0.78, decayRatio: 1 },
      { frequencyRatio: 1.48, gain: 0.42, decayRatio: 1.3 },
      { frequencyRatio: 2.13, gain: 0.2, decayRatio: 1.6 },
    ],
  },
  beep: {
    frequencyHz: 920,
    decayPerSecond: 105,
    durationSeconds: 0.07,
    amplitude: 0.75,
    partials: [
      { frequencyRatio: 1, gain: 1, decayRatio: 1 },
      { frequencyRatio: 2, gain: 0.18, decayRatio: 1.1 },
    ],
  },
  bell: {
    frequencyHz: 1_320,
    decayPerSecond: 52,
    durationSeconds: 0.12,
    amplitude: 0.68,
    partials: [
      { frequencyRatio: 1, gain: 0.75, decayRatio: 1 },
      { frequencyRatio: 2.01, gain: 0.37, decayRatio: 1.2 },
      { frequencyRatio: 3.9, gain: 0.2, decayRatio: 1.5 },
    ],
  },
  soft: {
    frequencyHz: 680,
    decayPerSecond: 155,
    durationSeconds: 0.08,
    amplitude: 0.56,
    partials: [
      { frequencyRatio: 1, gain: 1, decayRatio: 1 },
      { frequencyRatio: 1.5, gain: 0.12, decayRatio: 1.4 },
    ],
  },
};

export function createClickSamples(
  sound: SoundPreset,
  sampleRate: number,
): Float32Array<ArrayBuffer> {
  const profile = SOUND_PROFILES[sound];
  const samples = new Float32Array(Math.ceil(sampleRate * profile.durationSeconds));
  const totalPartialGain = profile.partials.reduce((total, partial) => total + partial.gain, 0);

  for (let frame = 0; frame < samples.length; frame += 1) {
    const time = frame / sampleRate;
    let sample = 0;
    for (const partial of profile.partials) {
      const frequency = profile.frequencyHz * partial.frequencyRatio;
      const envelope = Math.exp(-time * profile.decayPerSecond * partial.decayRatio);
      sample += Math.sin(2 * Math.PI * frequency * time) * envelope * partial.gain;
    }
    samples[frame] = (sample / totalPartialGain) * profile.amplitude;
  }

  return samples;
}
