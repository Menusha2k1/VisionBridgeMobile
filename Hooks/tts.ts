import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

type SpeakOpts = Speech.SpeechOptions & { haptic?: boolean };

export const TTS = {
  async speak(text: string, opts: SpeakOpts = {}) {
    if (!text?.trim()) return;
    if (opts.haptic) Haptics.selectionAsync().catch(() => {});
    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 1.0,
      ...opts,
    });
  },
  stop() {
    Speech.stop();
  },
  isSpeakingAsync: Speech.isSpeakingAsync,
};
