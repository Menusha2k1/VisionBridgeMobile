// import "./utils/"; // MUST BE THE FIRST LINE

import React from "react";
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
import Help from "./Screens/Help";
import { SpeechProvider } from "./Context/SpeechContext";

// import * as tf from "@tensorflow/tfjs";
// import "@tensorflow/tfjs-react-native";
// import * as tfLayers from "@tensorflow/tfjs-layers";
// import "@tensorflow/tfjs-backend-cpu"; // Or '@tensorflow/tfjs-react-native'
// import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
// import { useEffect, useState } from "react";
// import { SettingsProvider } from "./Context/SettingsContext";

// Teacher screens
import TeacherLogin from "./Screens/Teacher/login";
import TeacherDashboard from "./Screens/Teacher/Dashboard";
import TeacherLessonUpload from "./Screens/Teacher/LessonUpload";
import TeacherStudents from "./Screens/Teacher/Students";
import TeacherStudentRegistration from "./Screens/Teacher/StudentRegistration";
import TeacherReports from "./Screens/Teacher/Reports";
import TeacherWeakTopics from "./Screens/Teacher/WeakTopics";
import TeacherSettings from "./Screens/Teacher/Settings";
import AssessmentList from "./Screens/AssessmentList";
import TeacherStudentsList from "./Screens/Teacher/StudentsList";

export type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: { id: number };
  Grades: undefined;
  Lessons: { grade: string };
  Content: { lessonId: string; grade: string };
  QuizList: { subCategoryId: number };
  Quiz: { quizId: number };
  Help: undefined;
  StudentLogin: undefined;
  AssessmentList: undefined; // ← add this line

  // Teacher routes
  TeacherLogin: undefined;
  TeacherDashboard: undefined;
  TeacherLessonUpload: undefined;
  TeacherStudents: undefined;
  TeacherStudentRegistration: undefined;
  TeacherReports: undefined;
  TeacherWeakTopics: undefined;
  TeacherSettings: undefined;

  TeacherStudentsList: undefined;

  LessonPlayer: { subTopicId: string; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    // <SettingsProvider>
    <SpeechProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
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
          <Stack.Screen name="AssessmentList" component={AssessmentList} />
          <Stack.Screen name="Help" component={Help} />
          {/* Teacher / Research ML Flow */}
          <Stack.Screen
            name="TeacherLogin"
            component={TeacherLogin}
            options={{ title: "Teacher Login" }}
          />
          <Stack.Screen
            name="TeacherDashboard"
            component={TeacherDashboard}
            options={{ title: "Teacher Dashboard" }}
          />
          <Stack.Screen
            name="TeacherLessonUpload"
            component={TeacherLessonUpload}
            options={{ title: "Lesson Upload" }}
          />
          <Stack.Screen
            name="TeacherStudents"
            component={TeacherStudents}
            options={{ title: "Students" }}
          />
          <Stack.Screen
            name="TeacherStudentRegistration"
            component={TeacherStudentRegistration}
            options={{ title: "Register Student" }}
          />
          <Stack.Screen
            name="TeacherReports"
            component={TeacherReports}
            options={{ title: "Reports" }}
          />
          <Stack.Screen
            name="TeacherWeakTopics"
            component={TeacherWeakTopics}
            options={{ title: "Weak Topics" }}
          />
          <Stack.Screen
            name="TeacherSettings"
            component={TeacherSettings}
            options={{ title: "Settings" }}
          />
          <Stack.Screen
            name="TeacherStudentsList"
            component={TeacherStudentsList}
            options={{ title: "Students" }}
          />

          {/* <Stack.Screen name="Quiz" component={Quiz} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </SpeechProvider>
  );
}
