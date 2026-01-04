export interface Student {
  id: string;
  name: string;
  pin: string; // The 5-digit code
  grade: string;
  lastLessonId?: string;
}

export const STUDENTS_DB: Student[] = [
  {
    id: "S001",
    name: "Kasun Perera",
    pin: "12345", // Test PIN 1
    grade: "Grade 10",
  },
  {
    id: "S002",
    name: "Amara Silva",
    pin: "54321", // Test PIN 2
    grade: "Grade 11",
  },
  {
    id: "S003",
    name: "Nimal Siri",
    pin: "00000", // Test PIN 3
    grade: "Grade 10",
  },
];

// Helper function to validate login
export const validateStudentLogin = (enteredPin: string): Student | null => {
  const student = STUDENTS_DB.find((s) => s.pin === enteredPin);
  return student || null;
};
