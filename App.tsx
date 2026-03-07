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
import SubCatergories from "./Screens/SubCatergories";
import QuizList from "./Screens/QuizList";
import Content from "./Screens/Content";
import StudentLogin from "./Screens/StudentLogin";

// Teacher screens
import TeacherLogin from "./Screens/Teacher/login";
import TeacherDashboard from "./Screens/Teacher/Dashboard";
import TeacherLessonUpload from "./Screens/Teacher/LessonUpload";
import TeacherStudents from "./Screens/Teacher/Students";
import TeacherStudentRegistration from "./Screens/Teacher/StudentRegistration";
import TeacherReports from "./Screens/Teacher/Reports";
import TeacherWeakTopics from "./Screens/Teacher/WeakTopics";
import TeacherSettings from "./Screens/Teacher/Settings";

export type RootStackParamList = {
  Home: undefined;
  Modules: undefined;
  Marks: undefined;
  Quizes: undefined;
  Assessments: undefined;
  Grades: undefined;
  Lessons: { grade: string };
  Content: { lessonId: string; grade: string };
  SubCategories: { lessonId: number };
  QuizList: { subCategoryId: number };
  Quiz: { quizId: number };
  StudentLogin: undefined;

  // Teacher routes
  TeacherLogin: undefined;
  TeacherDashboard: undefined;
  TeacherLessonUpload: undefined;
  TeacherStudents: undefined;
  TeacherStudentRegistration: undefined;
  TeacherReports: undefined;
  TeacherWeakTopics: undefined;
  TeacherSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName="StudentLogin"
      >
        {/* Student Flow */}
        <Stack.Screen
          name="StudentLogin"
          component={StudentLogin}
          options={{ title: "Student Login" }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: "Home" }}
        />
        <Stack.Screen
          name="Modules"
          component={Modules}
          options={{ title: "Modules" }}
        />
        <Stack.Screen
          name="Marks"
          component={Marks}
          options={{ title: "Marks" }}
        />
        <Stack.Screen
          name="Quizes"
          component={Quizes}
          options={{ title: "Quizes" }}
        />
        <Stack.Screen
          name="Assessments"
          component={Assessments}
          options={{ title: "Assessments" }}
        />
        <Stack.Screen
          name="Grades"
          component={Grades}
          options={{ title: "Grades" }}
        />
        <Stack.Screen
          name="Lessons"
          component={Lessons}
          options={{ title: "Lessons" }}
        />
        <Stack.Screen
          name="SubCategories"
          component={SubCatergories}
          options={{ title: "Sub Categories" }}
        />
        <Stack.Screen
          name="Content"
          component={Content}
          options={{ title: "Lesson Content" }}
        />
        <Stack.Screen
          name="QuizList"
          component={QuizList}
          options={{ title: "Quiz List" }}
        />

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

        {/* <Stack.Screen name="Quiz" component={Quiz} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}