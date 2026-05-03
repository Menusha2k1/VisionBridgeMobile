/**
 * Central list of syllabus-aligned categories.
 * Keeping them here avoids typo bugs and helps filtering.
 */

export const ICT_CATEGORIES = [
  "Health/Security",
  "Networking",
  "ICT Applications",
  "Logic Gates",
  "Legal/Ethical",
  "Operating Systems",
  "Web Development",
  "Databases",
  "Programming (Pascal)",
  "SDLC",
  "Hardware",
  "Data Representation",
] as const;

export type QuizCategoryId = (typeof ICT_CATEGORIES)[number];

/**
 * Optional helper: return a user-friendly label if you ever want
 * to display a different string than the id.
 */
export function categoryLabel(id: QuizCategoryId): string {
  return id;
}
