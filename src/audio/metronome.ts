import { AudioContext } from 'react-native-audio-api';
import type { AudioBuffer } from 'react-native-audio-api';
import {
  createClickSamples,
  createMusicNoteSamples,
  createPitchedNoteSamples,
  SOUND_OPTIONS,
} from '@/audio/soundPresets';
import {
  getAccompanimentNotesAtBeat,
  getBeatAudioTime,
  getResumeCountInPlan,
  isPatternChangeBeat,
  PATTERN_CHANGE_CUE,
  SESSION_START_CUE,
} from '@/audio/musicPattern';
import type { ReplayAudioEvent } from '@/audio/replay';
import type { ReferenceRhythmEvent, SoundPreset } from '@/types/rhythm';

interface MetronomeStartOptions {
  sessionStartAudioTime: number;
  sessionStartTime?: number;
  bpm: number;
  beatsPerBar: number;
  durationSeconds: number | null;
  soundEnabled: boolean;
  backgroundMusicEnabled?: boolean;
  sessionCuesEnabled?: boolean;
  changeIntervalBeats?: number;
  patternChangesEnabled?: boolean;
  referenceRhythmEnabled?: boolean;
  getReferenceEventsThrough?: (timeMs: number) => readonly ReferenceRhythmEvent[];
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
  private readonly scheduledSources = new Set<ReturnType<AudioContext['createBufferSource']>>();
  private readonly pitchedNoteBuffers = new Map<number, AudioBuffer>();
  private readonly musicNoteBuffers = new Map<number, AudioBuffer>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private replayStopTimer: ReturnType<typeof setTimeout> | undefined;
  private startOptions: MetronomeStartOptions | undefined;
  private sounds: MetronomeSounds = { metronome: 'wood', leftHand: 'soft', rightHand: 'beep' };
  private nextBeatIndex = -COUNT_IN_BEATS;
  private readonly scheduledReferenceEventIds = new Set<string>();
  private paused = false;
  private closed = false;

  constructor() {
    this.output.connect(this.context.destination);
  }

  get currentTime(): number {
    return this.context.currentTime;
  }

  async resume(): Promise<void> {
    await this.context.resume();
    if (this.paused) {
      this.paused = false;
      this.output.gain.value = this.startOptions?.soundEnabled ? 0.75 : 0;
      this.scheduleAhead();
    }
  }

  async resumeWithCountIn(): Promise<{ durationMs: number }> {
    const options = this.startOptions;
    if (!options || this.closed) throw new Error('The metronome is unavailable.');

    await this.context.resume();
    const plan = getResumeCountInPlan(
      this.context.currentTime,
      options.sessionStartAudioTime,
      options.bpm,
      options.beatsPerBar,
    );
    const firstClickTime = this.context.currentTime + plan.firstBeatOffsetMs / 1_000;
    for (let index = 0; index < options.beatsPerBar; index += 1) {
      const beatIndex = plan.nextBeatIndex + index;
      const beatInBar = ((beatIndex % options.beatsPerBar) + options.beatsPerBar) % options.beatsPerBar;
      this.scheduleClick(firstClickTime + index * plan.beatDurationMs / 1_000, this.sounds.metronome, beatInBar === 0 ? 1.15 : 0.78);
    }

    options.sessionStartAudioTime += plan.durationMs / 1_000;
    this.nextBeatIndex = Math.max(0, plan.nextBeatIndex);
    this.scheduledReferenceEventIds.clear();
    this.paused = false;
    this.output.gain.value = options.soundEnabled ? 0.75 : 0;
    this.scheduleAhead();
    return { durationMs: plan.durationMs };
  }

  async pause(): Promise<void> {
    if (this.closed || this.paused) return;
    this.paused = true;
    this.output.gain.value = 0;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.startOptions) {
      const beatDurationSeconds = 60 / this.startOptions.bpm;
      const elapsedBeats = (this.context.currentTime - this.startOptions.sessionStartAudioTime) / beatDurationSeconds;
      this.nextBeatIndex = Math.floor(elapsedBeats) + 1;
    }
    this.scheduledReferenceEventIds.clear();
    this.cancelScheduledSources();
    await this.context.suspend();
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
    this.output.gain.value = enabled && !this.paused ? 0.75 : 0;
  }

  setReferenceRhythmEnabled(enabled: boolean): void {
    if (this.startOptions) this.startOptions.referenceRhythmEnabled = enabled;
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

  playReplayEvents(
    events: readonly ReplayAudioEvent[],
    sounds: MetronomeSounds,
    durationMs: number,
  ): void {
    if (this.closed) return;
    this.setSounds(sounds);
    for (const sound of new Set(Object.values(sounds))) this.getClickBuffer(sound);
    this.output.gain.value = 0.75;

    const preparedEvents = events.map((event) => {
      const buffers = event.midiPitches?.length
        ? event.midiPitches
          .filter((midiPitch) => Number.isFinite(midiPitch) && midiPitch >= 0 && midiPitch <= 127)
          .map((midiPitch) => this.getPitchedNoteBuffer(midiPitch))
        : [this.getClickBuffer(event.hand === 'left' ? sounds.leftHand : sounds.rightHand)];
      return {
        offsetMs: event.offsetMs,
        level: event.source === 'expected' ? 0.34 : 0.72,
        buffers,
      };
    });

    // Leave a short audio-clock lead-in so the native playhead can start in sync.
    const replayStartTime = this.context.currentTime + 0.04;
    for (const event of preparedEvents) {
      const when = replayStartTime + event.offsetMs / 1_000;
      for (const buffer of event.buffers) this.scheduleBuffer(when, buffer, event.level);
    }

    if (this.replayStopTimer) clearTimeout(this.replayStopTimer);
    this.replayStopTimer = setTimeout(() => {
      void this.stop();
    }, Math.max(0, durationMs) + 450);
  }

  private scheduleAhead = (): void => {
    const options = this.startOptions;
    if (!options || this.closed || this.paused) return;

    const beatDurationSeconds = 60 / options.bpm;
    const horizon = this.context.currentTime + LOOKAHEAD_SECONDS;
    const endTime =
      options.durationSeconds === null
        ? Number.POSITIVE_INFINITY
        : options.sessionStartAudioTime + options.durationSeconds;

    while (true) {
      const beatTime = getBeatAudioTime(options.sessionStartAudioTime, options.bpm, this.nextBeatIndex);
      if (beatTime > horizon || beatTime >= endTime) break;
      if (beatTime >= this.context.currentTime - 0.01) {
        const beatInBar = ((this.nextBeatIndex % options.beatsPerBar) + options.beatsPerBar) % options.beatsPerBar;
        this.scheduleClick(beatTime, this.sounds.metronome, beatInBar === 0 ? 1.15 : 0.78);

        if (this.nextBeatIndex >= 0 && options.soundEnabled) {
          if (options.backgroundMusicEnabled) {
            for (const note of getAccompanimentNotesAtBeat(this.nextBeatIndex, options.beatsPerBar)) {
              this.scheduleBuffer(beatTime, this.getMusicNoteBuffer(note.midiPitch), note.level);
            }
          }

          if (options.sessionCuesEnabled && this.nextBeatIndex === 0) {
            for (const note of SESSION_START_CUE) {
              const cueTime = beatTime + note.offsetBeats * beatDurationSeconds;
              if (cueTime >= this.context.currentTime - 0.01 && cueTime <= horizon) {
                this.scheduleBuffer(cueTime, this.getMusicNoteBuffer(note.midiPitch), note.level);
              }
            }
          }

          if (
            options.sessionCuesEnabled
            && options.patternChangesEnabled !== false
            && isPatternChangeBeat(this.nextBeatIndex, options.changeIntervalBeats ?? 4)
          ) {
            this.scheduleBuffer(
              beatTime,
              this.getMusicNoteBuffer(PATTERN_CHANGE_CUE.midiPitch),
              PATTERN_CHANGE_CUE.level,
            );
          }
        }
      }
      this.nextBeatIndex += 1;
    }

    if (
      options.referenceRhythmEnabled
      && options.soundEnabled
      && options.sessionStartTime !== undefined
      && options.getReferenceEventsThrough
    ) {
      const performanceHorizon =
        options.sessionStartTime + (horizon - options.sessionStartAudioTime) * 1_000;
      for (const event of options.getReferenceEventsThrough(performanceHorizon)) {
        if (this.scheduledReferenceEventIds.has(event.id)) continue;
        this.scheduledReferenceEventIds.add(event.id);
        const audioTime = options.sessionStartAudioTime
          + (event.expectedTimeMs - options.sessionStartTime) / 1_000;
        if (audioTime < this.context.currentTime - 0.01 || audioTime > horizon) continue;
        if (event.midiPitches?.length) {
          for (const midiPitch of event.midiPitches) {
            if (!Number.isFinite(midiPitch) || midiPitch < 0 || midiPitch > 127) continue;
            this.scheduleBuffer(audioTime, this.getPitchedNoteBuffer(midiPitch), 0.5);
          }
        } else {
          const preset = event.hand === 'left' ? this.sounds.leftHand : this.sounds.rightHand;
          this.scheduleClick(audioTime, preset, 0.42);
        }
      }
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
      this.scheduledSources.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(when);
    this.scheduledSources.add(source);
  }

  private cancelScheduledSources(): void {
    for (const source of this.scheduledSources) {
      try {
        source.stop();
      } catch {
        // A source that already ended cannot be stopped again.
      }
    }
    this.scheduledSources.clear();
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

  private getMusicNoteBuffer(midiPitch: number): AudioBuffer {
    const cachedBuffer = this.musicNoteBuffers.get(midiPitch);
    if (cachedBuffer) return cachedBuffer;

    const samples = createMusicNoteSamples(midiPitch, this.context.sampleRate);
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.copyToChannel(samples, 0);
    this.musicNoteBuffers.set(midiPitch, buffer);
    return buffer;
  }

  async stop(): Promise<void> {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.replayStopTimer) clearTimeout(this.replayStopTimer);
    this.timer = undefined;
    this.replayStopTimer = undefined;
    this.startOptions = undefined;
    await this.context.close();
  }
}
