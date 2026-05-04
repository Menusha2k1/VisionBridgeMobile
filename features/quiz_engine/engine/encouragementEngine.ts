type EncouragementContext = {
  isCorrect: boolean;
  correctStreak?: number;
  wrongStreak?: number;
  topic?: string;
  improvedTopic?: boolean;
  usedHint?: boolean;
  isRepeatedQuestion?: boolean;
};

function pickRandom(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

export function getEncouragementMessage(ctx: EncouragementContext): string {
  if (ctx.isCorrect) {
    if (ctx.improvedTopic && ctx.topic) {
      return pickRandom([
        `Good job. You are improving in ${ctx.topic}.`,
        `Nice work. You did better in ${ctx.topic} this time.`,
        `Well done. Your understanding of ${ctx.topic} is improving.`,
      ]);
    }

    if ((ctx.correctStreak ?? 0) >= 3) {
      return pickRandom([
        "Excellent work. You are answering consistently well.",
        "Great job. You are building strong confidence.",
        "Very good. Keep up this progress.",
      ]);
    }

    if (ctx.isRepeatedQuestion) {
      return pickRandom([
        "Great job. You corrected your earlier mistake.",
        "Well done. You learned from the previous attempt.",
        "Nice recovery. You got it right this time.",
      ]);
    }

    return pickRandom([
      "Correct. Well done.",
      "Great job. Keep going.",
      "Nice work.",
      "Excellent. Let us continue.",
    ]);
  }

  if ((ctx.wrongStreak ?? 0) >= 2 && ctx.topic) {
    return pickRandom([
      `Keep trying. We will practice ${ctx.topic} more.`,
      `That is okay. ${ctx.topic} needs a little more revision.`,
      `Do not worry. I will help you with ${ctx.topic}.`,
    ]);
  }

  if (ctx.usedHint) {
    return pickRandom([
      "Good effort. Use the hint and try to understand the concept.",
      "That is okay. The hint will guide you.",
      "Keep trying. You are still learning this topic.",
    ]);
  }

  return pickRandom([
    "That is okay. Keep trying.",
    "Not quite right. Let us continue learning.",
    "Good effort. You can improve with more practice.",
  ]);
}