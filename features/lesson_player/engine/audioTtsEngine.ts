import * as Speech from "expo-speech";
import AudioService from "../../services/audioService";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  language?: string;
  prependInstructionOnce?: string | null;
  doNotInterrupt?: boolean;

  /**
   * Preferred registry-based lookup key
   */
  audioKey?: string | null;

  /**
   * Optional direct bundled audio source
   */
  audioSource?: any;
};

type QueueItem = {
  text: string;
  audioKey?: string | null;
  audioSource?: any;
};

export class AudioTtsEngine {
  private rate: number;
  private pitch: number;
  private language: string;

  private queue: QueueItem[] = [];
  private speaking = false;
  private requestId = 0;
  private lastInstructionToken: string | null = null;

  private audioService = new AudioService();

  constructor(opts?: { rate?: number; pitch?: number; language?: string }) {
    this.rate = opts?.rate ?? 0.82;
    this.pitch = opts?.pitch ?? 0.98;
    this.language = opts?.language ?? "en-US";

    void this.audioService.configureAudioMode();
  }

  setVoiceConfig(cfg: { rate?: number; pitch?: number; language?: string }) {
    if (typeof cfg.rate === "number") this.rate = cfg.rate;
    if (typeof cfg.pitch === "number") this.pitch = cfg.pitch;
    if (typeof cfg.language === "string") this.language = cfg.language;
  }

  speak(text: string, options?: SpeakOptions) {
    void this.speakAsync(text, options);
  }

  async speakAsync(text: string, options?: SpeakOptions) {
    const cleaned = this.normalizeText(text);
    const audioKey = options?.audioKey ?? null;
    const audioSource = options?.audioSource;

    if (!cleaned && !audioKey && !audioSource) return;

    const cfg = {
      rate: options?.rate ?? this.rate,
      pitch: options?.pitch ?? this.pitch,
      language: options?.language ?? this.language,
    };

    if (!options?.doNotInterrupt) {
      await this.stopAsync();
    }

    const myId = ++this.requestId;

    const instruction = options?.prependInstructionOnce ?? null;
    const instructionToken = instruction ? `INSTR:${instruction}` : null;

    const chunks: QueueItem[] = [];

    if (instruction && instructionToken !== this.lastInstructionToken) {
      this.lastInstructionToken = instructionToken;
      chunks.push({
        text: this.normalizeText(instruction),
      });
    }

    if (audioKey || audioSource) {
      chunks.push({
        text: cleaned,
        audioKey,
        audioSource,
      });
    } else {
      chunks.push(
        ...this.chunkText(cleaned).map((part) => ({
          text: part,
        }))
      );
    }

    if (options?.doNotInterrupt && this.queue.length) {
      this.queue.push(...chunks.filter((x) => x.text || x.audioKey || x.audioSource));
    } else {
      this.queue = chunks.filter((x) => x.text || x.audioKey || x.audioSource);
    }

    await this.playQueue(myId, cfg);
  }

  stop() {
    void this.stopAsync();
  }

  async stopAsync() {
    this.requestId += 1;
    this.queue = [];
    this.speaking = false;

    try {
      Speech.stop();
    } catch {}

    try {
      await this.audioService.stop();
    } catch {}
  }

  private async playQueue(
    myId: number,
    cfg: { rate: number; pitch: number; language: string }
  ) {
    if (myId !== this.requestId) return;
    if (this.speaking) return;

    this.speaking = true;

    while (this.queue.length > 0) {
      if (myId !== this.requestId) {
        this.speaking = false;
        return;
      }

      const item = this.queue.shift();
      if (!item) continue;

      await this.delay(140);

      if (myId !== this.requestId) {
        this.speaking = false;
        return;
      }

      let playedAudio = false;

      if (item.audioSource) {
        playedAudio = await this.playOneAudioSource(item.audioSource, myId);
      } else if (item.audioKey) {
        playedAudio = await this.playOneAudioKey(item.audioKey, myId);
      }

      if (!playedAudio && item.text) {
        await this.speakOne(item.text, cfg, myId);
      }
    }

    this.speaking = false;
  }

  private async playOneAudioKey(key: string, myId: number): Promise<boolean> {
    if (myId !== this.requestId) return false;

    try {
      return await this.audioService.playByKeyAsync(key);
    } catch {
      return false;
    }
  }

  private async playOneAudioSource(source: any, myId: number): Promise<boolean> {
    if (myId !== this.requestId) return false;

    try {
      await this.audioService.playLocalAsync(source);
      return true;
    } catch {
      return false;
    }
  }

  private speakOne(
    text: string,
    cfg: { rate: number; pitch: number; language: string },
    myId: number
  ) {
    return new Promise<void>((resolve) => {
      if (myId !== this.requestId) return resolve();

      try {
        Speech.speak(text, {
          rate: cfg.rate,
          pitch: cfg.pitch,
          language: cfg.language,
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        });
      } catch {
        resolve();
      }
    });
  }

  private delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  private normalizeText(input: string) {
    let s = (input ?? "").trim();
    if (!s) return "";

    s = s.replace(/\bICT\b/g, "I C T");
    s = s.replace(/\bO\/L\b/g, "O level");
    s = s.replace(/\bA\/L\b/g, "A level");
    s = s.replace(/\bG\s?(\d{1,2})\b/g, "Grade $1");
    s = s.replace(/&/g, " and ");
    s = s.replace(/\//g, " slash ");
    s = s.replace(/%/g, " percent ");
    s = s.replace(/#/g, " number ");
    s = s.replace(/\+/g, " plus ");
    s = s.replace(/\s+/g, " ").trim();

    if (!/[.!?]$/.test(s)) s = s + ".";

    return s;
  }

  private chunkText(text: string) {
    const s = (text ?? "").trim();
    if (!s) return [];

    const sentences = s
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

    const chunks: string[] = [];

    for (const sent of sentences) {
      if (sent.length <= 120) {
        chunks.push(sent);
        continue;
      }

      const parts = sent
        .split(/(?<=,|;|:)\s+|\s+(?=and\s+)/i)
        .map((x) => x.trim())
        .filter(Boolean);

      for (const p of parts) {
        if (p.length <= 140) chunks.push(p);
        else chunks.push(...this.chunkByWords(p, 18));
      }
    }

    return chunks;
  }

  private chunkByWords(text: string, maxWords: number) {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];

    let buf: string[] = [];
    for (const w of words) {
      buf.push(w);
      if (buf.length >= maxWords) {
        out.push(buf.join(" ").trim());
        buf = [];
      }
    }

    if (buf.length) out.push(buf.join(" ").trim());

    return out;
  }
}