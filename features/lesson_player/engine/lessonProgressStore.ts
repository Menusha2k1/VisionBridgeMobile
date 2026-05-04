import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "vb_lesson_cursor_v1";

export interface LessonCursor {
  /** Index of the current segment within the flattened segments list. */
  segmentIndex: number;
  /** Last time this position was updated (Unix timestamp ms). */
  updatedAt: number;
}

/**
 * Load the last saved lesson cursor from storage.
 */
export async function loadLessonCursor(): Promise<LessonCursor | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.segmentIndex !== "number"
    ) {
      return null;
    }
    return parsed as LessonCursor;
  } catch {
    return null;
  }
}

/**
 * Save the current lesson cursor to storage.
 */
export async function saveLessonCursor(cursor: LessonCursor): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cursor));
  } catch {
    // Non-fatal: ignore errors
  }
}

/**
 * Clear any saved cursor (used if user wants to restart from beginning).
 */
export async function clearLessonCursor(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
