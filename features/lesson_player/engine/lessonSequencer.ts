import { LessonContentSegment } from "../../data/datasetLoader";

export class LessonSequencer {
  private segments: LessonContentSegment[];
  private idx = 0;

  constructor(segments: LessonContentSegment[]) {
    this.segments = segments ?? [];
    this.idx = 0;
  }

  current(): LessonContentSegment | null {
    return this.segments[this.idx] ?? null;
  }

  next(): LessonContentSegment | null {
    if (this.idx < this.segments.length - 1) {
      this.idx += 1;
    }
    return this.current();
  }

  prev(): LessonContentSegment | null {
    if (this.idx > 0) {
      this.idx -= 1;
    }
    return this.current();
  }

  index(): number {
    return this.idx;
  }

  total(): number {
    return this.segments.length;
  }
}