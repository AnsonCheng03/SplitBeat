import { AudioContext } from 'react-native-audio-api';

interface MetronomeStartOptions {
  sessionStartAudioTime: number;
  bpm: number;
  durationSeconds: number | null;
  soundEnabled: boolean;
}

const COUNT_IN_BEATS = 3;
const LOOKAHEAD_SECONDS = 5;
const SCHEDULER_DELAY_MS = 120;

export class MetronomeAudio {
  private readonly context = new AudioContext();
  private readonly output = this.context.createGain();
  private normalClick = this.createClickBuffer(1_350, 0.7);
  private accentClick = this.createClickBuffer(1_850, 1);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private startOptions: MetronomeStartOptions | undefined;
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

  start(options: MetronomeStartOptions): void {
    this.startOptions = options;
    this.setSoundEnabled(options.soundEnabled);
    this.scheduleAhead();
  }

  setSoundEnabled(enabled: boolean): void {
    if (this.startOptions) this.startOptions.soundEnabled = enabled;
    this.output.gain.value = enabled ? 0.75 : 0;
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
        this.scheduleClick(beatTime, this.nextBeatIndex % 4 === 0);
      }
      this.nextBeatIndex += 1;
    }

    this.timer = setTimeout(this.scheduleAhead, SCHEDULER_DELAY_MS);
  };

  private scheduleClick(when: number, accent: boolean): void {
    const source = this.context.createBufferSource();
    source.buffer = accent ? this.accentClick : this.normalClick;
    source.connect(this.output);
    source.start(when);
  }

  private createClickBuffer(frequency: number, amplitude: number) {
    const sampleRate = this.context.sampleRate;
    const durationSeconds = 0.022;
    const frameCount = Math.ceil(sampleRate * durationSeconds);
    const buffer = this.context.createBuffer(1, frameCount, sampleRate);
    const samples = buffer.getChannelData(0);

    for (let frame = 0; frame < frameCount; frame += 1) {
      const time = frame / sampleRate;
      const envelope = Math.exp(-time * 190);
      samples[frame] = Math.sin(2 * Math.PI * frequency * time) * envelope * amplitude;
    }

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
