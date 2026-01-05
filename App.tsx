// import "./utils/"; // MUST BE THE FIRST LINE

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./Screens/Home";
import Modules from "./Screens/Modules";
import Marks from "./Screens/Marks";
import Quizes from "./Screens/Quizes";
import Assessments from "./Screens/Assesments";
import Grades from "./Screens/Grades";
import Lessons from "./Screens/Lessons";
import QuizList from "./Screens/QuizList";
import Content from "./Screens/Content";
import StudentLogin from "./Screens/StudentLogin";
import LessonPlayer from "./components/LessonPlayer";

// import * as tf from "@tensorflow/tfjs";
// import "@tensorflow/tfjs-react-native";
// import * as tfLayers from "@tensorflow/tfjs-layers";
// import "@tensorflow/tfjs-backend-cpu"; // Or '@tensorflow/tfjs-react-native'
// import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
// import { useEffect, useState } from "react";
// import { SettingsProvider } from "./Context/SettingsContext";

export type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  Grades: undefined;
  Lessons: { grade: string }; // Changed from number to string
  Content: { lessonId: string; grade: string };
  QuizList: { subCategoryId: number };
  Quiz: { quizId: number };
  StudentLogin: undefined;
  LessonPlayer: { subTopicId: string; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // const [isAiReady, setIsAiReady] = useState(false);
  // useEffect(() => {
  //   async function setup() {
  //     try {
  //       // 1. Wait for the hardware bridge
  //       await tf.ready();
  //       // 2. Explicitly set and verify the backend
  //       await tf.setBackend("cpu");
  //       console.log("AI Engine status:", tf.getBackend());
  //       setIsAiReady(true);
  //     } catch (e) {
  //       console.error("AI Initialization failed", e);
  //     }
  //   }
  //   setup();
  // }, []);

  // if (!isAiReady) {
  //   return null; // Or a loading screen for the student
  // }
  return (
    // <SettingsProvider>
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
        <Stack.Screen name="Content" component={Content} />
        <Stack.Screen name="QuizList" component={QuizList} />
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        <Stack.Screen name="LessonPlayer" component={LessonPlayer} />

        {/* <Stack.Screen name="Quiz" component={Quiz} /> */}
      </Stack.Navigator>
    </NavigationContainer>
    // </SettingsProvider>
  );
}
