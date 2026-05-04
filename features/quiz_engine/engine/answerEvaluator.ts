import { QuizQuestion } from "../../data/datasetLoader";

export function evaluateAnswer(q: QuizQuestion, selected: string): boolean {
  return selected.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
}
