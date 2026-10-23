import { AudioContext } from 'react-native-audio-api';
import type { AudioBuffer } from 'react-native-audio-api';
import {
  createClickSamples,
  createPitchedNoteSamples,
  SOUND_OPTIONS,
} from '@/audio/soundPresets';
import type { MissedEvent, SoundPreset } from '@/types/rhythm';

interface MetronomeStartOptions {
  sessionStartAudioTime: number;
  bpm: number;
  beatsPerBar: number;
  durationSeconds: number | null;
  soundEnabled: boolean;
  sounds: MetronomeSounds;
}

export interface MetronomeSounds {
  metronome: SoundPreset;
  leftHand: SoundPreset;
  rightHand: SoundPreset;
}

const COUNT_IN_BEATS = 3;
const LOOKAHEAD_SECONDS = 5;
const SCHEDULER_DELAY_MS = 120;

export class MetronomeAudio {
  private readonly context = new AudioContext();
  private readonly output = this.context.createGain();
  private readonly clickBuffers = new Map<SoundPreset, AudioBuffer>();
  private readonly pitchedNoteBuffers = new Map<number, AudioBuffer>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private startOptions: MetronomeStartOptions | undefined;
  private sounds: MetronomeSounds = { metronome: 'wood', leftHand: 'soft', rightHand: 'beep' };
  private nextBeatIndex = -COUNT_IN_BEATS;
  private closed = false;

  constructor() {
    this.output.connect(this.context.destination);
  }

  get currentTime(): number {
    return this.context.currentTime;
  }

  async resume(): Promise<void> {
    await this.context.resume();
  }

  async prepare(): Promise<void> {
    if (this.closed) throw new Error('Cannot prepare a closed audio context');
    for (const { value } of SOUND_OPTIONS) this.getClickBuffer(value);
  }

  start(options: MetronomeStartOptions): void {
    this.startOptions = options;
    this.setSounds(options.sounds);
    for (const sound of new Set(Object.values(options.sounds))) this.getClickBuffer(sound);
    this.setSoundEnabled(options.soundEnabled);
    this.scheduleAhead();
  }

  setSounds(sounds: MetronomeSounds): void {
    this.sounds = sounds;
  }

  setSoundEnabled(enabled: boolean): void {
    if (this.startOptions) this.startOptions.soundEnabled = enabled;
    this.output.gain.value = enabled ? 0.75 : 0;
  }

  playHandClick(hand: 'left' | 'right'): void {
    if (!this.startOptions?.soundEnabled || this.closed) return;
    const preset = hand === 'left' ? this.sounds.leftHand : this.sounds.rightHand;
    this.scheduleClick(this.context.currentTime, preset, 0.48);
  }

  playScorePitches(midiPitches: readonly number[]): void {
    if (!this.startOptions?.soundEnabled || this.closed) return;
    const when = this.context.currentTime;
    for (const midiPitch of midiPitches) {
      if (!Number.isFinite(midiPitch) || midiPitch < 0 || midiPitch > 127) continue;
      this.scheduleBuffer(when, this.getPitchedNoteBuffer(midiPitch), 0.62);
    }
  }

  replayMissedBar(options: {
    events: readonly MissedEvent[];
    bpm: number;
    beatsPerBar: number;
    soundEnabled: boolean;
    sounds: MetronomeSounds;
  }): number {
    if (this.closed || options.events.length === 0) return 0;
    this.setSounds(options.sounds);
    const startTime = this.context.currentTime + 0.45;
    const beatDurationSeconds = 60 / options.bpm;
    const playbackDurationMs = options.beatsPerBar * beatDurationSeconds * 1_000 + 350;
    this.startOptions = {
      sessionStartAudioTime: startTime,
      bpm: options.bpm,
      beatsPerBar: options.beatsPerBar,
      durationSeconds: playbackDurationMs / 1_000,
      soundEnabled: options.soundEnabled,
      sounds: options.sounds,
    };
    this.output.gain.value = options.soundEnabled ? 0.75 : 0;

    for (let beat = 0; beat < options.beatsPerBar; beat += 1) {
      this.scheduleClick(
        startTime + beat * beatDurationSeconds,
        options.sounds.metronome,
        beat === 0 ? 1.15 : 0.78,
      );
    }

    for (const event of options.events) {
      const eventTime = startTime + event.beatInBar * beatDurationSeconds;
      if (event.midiPitches?.length) {
        for (const midiPitch of event.midiPitches) {
          if (Number.isFinite(midiPitch) && midiPitch >= 0 && midiPitch <= 127) {
            this.scheduleBuffer(eventTime, this.getPitchedNoteBuffer(midiPitch), 0.62);
          }
        }
      } else {
        const sound = event.hand === 'left' ? options.sounds.leftHand : options.sounds.rightHand;
        this.scheduleClick(eventTime, sound, 0.48);
      }
    }

    return playbackDurationMs;
  }

  private scheduleAhead = (): void => {
    const options = this.startOptions;
    if (!options || this.closed) return;

    const beatDurationSeconds = 60 / options.bpm;
    const horizon = this.context.currentTime + LOOKAHEAD_SECONDS;
    const endTime =
      options.durationSeconds === null
        ? Number.POSITIVE_INFINITY
        : options.sessionStartAudioTime + options.durationSeconds;

    while (true) {
      const beatTime = options.sessionStartAudioTime + this.nextBeatIndex * beatDurationSeconds;
      if (beatTime > horizon || beatTime >= endTime) break;
      if (beatTime >= this.context.currentTime - 0.01) {
        const beatInBar = ((this.nextBeatIndex % options.beatsPerBar) + options.beatsPerBar) % options.beatsPerBar;
        this.scheduleClick(beatTime, this.sounds.metronome, beatInBar === 0 ? 1.15 : 0.78);
      }
      this.nextBeatIndex += 1;
    }

    this.timer = setTimeout(this.scheduleAhead, SCHEDULER_DELAY_MS);
  };

  private scheduleClick(when: number, sound: SoundPreset, level: number): void {
    this.scheduleBuffer(when, this.getClickBuffer(sound), level);
  }

  private scheduleBuffer(when: number, buffer: AudioBuffer, level: number): void {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = level;
    source.connect(gain);
    gain.connect(this.output);
    source.onEnded = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(when);
  }

  private getClickBuffer(sound: SoundPreset): AudioBuffer {
    const cachedBuffer = this.clickBuffers.get(sound);
    if (cachedBuffer) return cachedBuffer;

    const samples = createClickSamples(sound, this.context.sampleRate);
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.copyToChannel(samples, 0);
    this.clickBuffers.set(sound, buffer);
    return buffer;
  }

  private getPitchedNoteBuffer(midiPitch: number): AudioBuffer {
    const cachedBuffer = this.pitchedNoteBuffers.get(midiPitch);
    if (cachedBuffer) return cachedBuffer;

    const samples = createPitchedNoteSamples(midiPitch, this.context.sampleRate);
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.copyToChannel(samples, 0);
    this.pitchedNoteBuffers.set(midiPitch, buffer);
    return buffer;
  }

  async stop(): Promise<void> {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.startOptions = undefined;
    await this.context.close();
  }
}
