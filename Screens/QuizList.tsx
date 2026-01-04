import AccessibleList from "../components/AccessibleList";
import { quizzes } from "./data";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "QuizList">;

export default function QuizList({ route, navigation }: Props) {
  const filtered = quizzes.filter(
    (q) => q.subCategoryId === route.params.subCategoryId
  );

  return (
    <AccessibleList
      screenName="Quizzes"
      data={filtered}
      labelKey="title"
      onSelect={(q) => navigation.navigate("Quiz", { quizId: q.id })}
    />
  );
}
