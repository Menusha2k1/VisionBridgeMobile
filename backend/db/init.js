const db = require("./connection");

// Clear existing data
db.exec("DELETE FROM struggle_logs");
db.exec("DELETE FROM students");

// Pre-populate students
const insert = db.prepare(
  "INSERT INTO students (name, pin, grade) VALUES (?, ?, ?)",
);

const students = [
  { name: "Kasun Perera", pin: "1234", grade: "Grade 10" },
  { name: "Nimali Silva", pin: "5678", grade: "Grade 10" },
  { name: "Amal Fernando", pin: "1111", grade: "Grade 11" },
  { name: "Sithara Dias", pin: "2222", grade: "Grade 11" },
  { name: "Ruwan Jayasinghe", pin: "3333", grade: "Grade 10" },
];

const insertMany = db.transaction((entries) => {
  for (const s of entries) {
    insert.run(s.name, s.pin, s.grade);
  }
});

insertMany(students);

console.log(`Inserted ${students.length} students into the database.`);

// Verify
const all = db.prepare("SELECT * FROM students").all();
console.table(all);
