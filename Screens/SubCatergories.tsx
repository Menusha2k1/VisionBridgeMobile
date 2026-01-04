import AccessibleList from "../components/AccessibleList";
import { subCategories } from "./data";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "SubCategories">;

export default function SubCategories({ route, navigation }: Props) {
  const filtered = subCategories.filter(
    (s) => s.lessonId === route.params.lessonId
  );

  return (
    <AccessibleList
      screenName="Topics"
      data={filtered}
      labelKey="title"
      onSelect={(s) => navigation.navigate("QuizList", { subCategoryId: s.id })}
    />
  );
}
