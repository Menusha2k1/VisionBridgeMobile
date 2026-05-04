import { Audio, AVPlaybackStatus } from "expo-av";
import { audioRegistry } from "../data/audioRegistry";

export type AudioRegistryKey = keyof typeof audioRegistry;

export class AudioService {
  private sound: Audio.Sound | null = null;
  private currentKey: string | null = null;

  /**
   * Play a local bundled audio asset directly.
   */
  async playLocalAsync(source: any): Promise<void> {
    await this.stop();

    const { sound } = await Audio.Sound.createAsync(source);
    this.sound = sound;

    await sound.playAsync();

    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          resolve();
        }
      });
    });
  }

  /**
   * Play audio by registry key.
   * Returns true if audio was found and played.
   * Returns false if audio key is missing.
   */
  async playByKeyAsync(key?: string | null): Promise<boolean> {
    if (!key) return false;

    const source = audioRegistry[key];
    if (!source) return false;

    this.currentKey = key;
    await this.playLocalAsync(source);
    return true;
  }

  /**
   * Check whether a registry entry exists.
   */
  hasAudio(key?: string | null): boolean {
    if (!key) return false;
    return !!audioRegistry[key];
  }

  /**
   * Stop and unload current audio.
   */
  async stop(): Promise<void> {
    if (!this.sound) {
      this.currentKey = null;
      return;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.sound.stopAsync();
        }
        await this.sound.unloadAsync();
      }
    } catch {
      // ignore cleanup errors
    } finally {
      this.sound = null;
      this.currentKey = null;
    }
  }

  /**
   * Return currently tracked audio key.
   */
  getCurrentKey(): string | null {
    return this.currentKey;
  }

  /**
   * Optional one-time audio mode setup.
   */
  async configureAudioMode(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {
      // ignore setup failures
    }
  }
}

export default AudioService;