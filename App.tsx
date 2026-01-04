import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./Screens/Home";
import Modules from "./Screens/Modules";
import Marks from "./Screens/Marks";
import Quizes from "./Screens/Quizes";
import Assessments from "./Screens/Assesments";
import Grades from "./Screens/Grades";
import Lessons from "./Screens/Lessons";
import SubCatergories from "./Screens/SubCatergories";
import QuizList from "./Screens/QuizList";
import Content from "./Screens/Content";
import StudentLogin from "./Screens/StudentLogin";

export type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  Grades: undefined;
  Lessons: { grade: string }; // Changed from number to string
  Content: { lessonId: string; grade: string };
  SubCategories: { lessonId: number };
  QuizList: { subCategoryId: number };
  Quiz: { quizId: number };
  StudentLogin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName="StudentLogin"
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Modules" component={Modules} />
        <Stack.Screen name="Marks" component={Marks} />
        <Stack.Screen name="Quizes" component={Quizes} />
        <Stack.Screen name="Assessments" component={Assessments} />
        <Stack.Screen name="Grades" component={Grades} />
        <Stack.Screen name="Lessons" component={Lessons} />
        <Stack.Screen name="SubCategories" component={SubCatergories} />
        <Stack.Screen name="Content" component={Content} />
        <Stack.Screen name="QuizList" component={QuizList} />
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        {/* <Stack.Screen name="Quiz" component={Quiz} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
