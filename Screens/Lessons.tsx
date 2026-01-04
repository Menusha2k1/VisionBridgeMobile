import AccessibleList from "../components/AccessibleList";
import { lessons } from "./data";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Lessons">;

export default function Lessons({ route, navigation }: Props) {
  const filtered = lessons.filter((l) => l.grade === route.params.grade);

  return (
    <AccessibleList
      screenName="Lessons"
      data={filtered}
      labelKey="title"
      onSelect={(l) => navigation.navigate("SubCategories", { lessonId: l.id })}
    />
  );
}
