// Grades
export const grades = [
  { id: 10, title: "Grade 10" },
  { id: 11, title: "Grade 11" },
];

// Lessons
export const lessons = [
  { id: 1, grade: 10, title: "Introduction to IT" },
  { id: 2, grade: 10, title: "Computer Hardware" },
  { id: 3, grade: 11, title: "Networking Basics" },
];

// Sub Categories
export const subCategories = [
  { id: 1, lessonId: 1, title: "Basics of IT" },
  { id: 2, lessonId: 1, title: "History of Computers" },
  { id: 3, lessonId: 2, title: "Input Devices" },
];

// Quizzes
export const quizzes = [
  { id: 1, subCategoryId: 1, title: "IT Basics Quiz" },
  { id: 2, subCategoryId: 2, title: "Computer History Quiz" },
];
