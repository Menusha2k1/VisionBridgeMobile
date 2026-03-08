export type QuizQuestion = {
  id: number;
  grade: number;
  lessonId: number;
  question: string;
  options: { id: string; text: string; correct: boolean }[];
};

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    grade: 10,
    lessonId: 1,
    question: "Which component is considered the 'brain' of the computer?",

    options: [
      { id: "A", text: "RAM", correct: false },
      { id: "B", text: "CPU", correct: true },
      { id: "C", text: "Hard Drive", correct: false },
      { id: "D", text: "Monitor", correct: false },
    ],
  },
  {
    id: 2,
    grade: 10,
    lessonId: 1,
    question: "In computer networking, what does 'LAN' stand for?",
    options: [
      { id: "A", text: "Local Area Network", correct: true },
      { id: "B", text: "Large Area Network", correct: false },
      { id: "C", text: "Link Access Node", correct: false },
      { id: "D", text: "Live Access Network", correct: false },
    ],
  },
  {
    id: 3,
    grade: 10,
    lessonId: 1,
    question: "Which type of software is an Operating System?",
    options: [
      { id: "A", text: "Application Software", correct: false },
      { id: "B", text: "Utility Software", correct: false },
      { id: "C", text: "System Software", correct: true },
      { id: "D", text: "Malware", correct: false },
    ],
  },
  //   {
  //     id: 4,
  //     question: "What is the 4-bit binary equivalent of the decimal number 12?",
  //     options: [
  //       { id: "A", text: "1010", correct: false },
  //       { id: "B", text: "1100", correct: true },
  //       { id: "C", text: "1111", correct: false },
  //       { id: "D", text: "1001", correct: false },
  //     ],
  //   },
  //   {
  //     id: 5,
  //     question: "Which of the following is an output device?",
  //     options: [
  //       { id: "A", text: "Keyboard", correct: false },
  //       { id: "B", text: "Microphone", correct: false },
  //       { id: "C", text: "Printer", correct: true },
  //       { id: "D", text: "Scanner", correct: false },
  //     ],
  //   },
  //   {
  //     id: 6,
  //     question: "What is the primary function of a Router?",
  //     options: [
  //       { id: "A", text: "Displaying images", correct: false },
  //       { id: "B", text: "Directing data packets", correct: true },
  //       { id: "C", text: "Typing text", correct: false },
  //       { id: "D", text: "Cooling the CPU", correct: false },
  //     ],
  //   },
  //   {
  //     id: 7,
  //     question: "Which protocol is used specifically for transferring files?",
  //     options: [
  //       { id: "A", text: "HTTP", correct: false },
  //       { id: "B", text: "SMTP", correct: false },
  //       { id: "C", text: "FTP", correct: true },
  //       { id: "D", text: "HTML", correct: false },
  //     ],
  //   },
  //   {
  //     id: 8,
  //     question: "What happens to data in Volatile memory when power is lost?",
  //     options: [
  //       { id: "A", text: "It is saved to the cloud", correct: false },
  //       { id: "B", text: "It remains unchanged", correct: false },
  //       { id: "C", text: "It is permanently deleted", correct: true },
  //       { id: "D", text: "It moves to the CPU", correct: false },
  //     ],
  //   },
  //   {
  //     id: 9,
  //     question: "Which software acts as a barrier against network threats?",
  //     options: [
  //       { id: "A", text: "Firewall", correct: true },
  //       { id: "B", text: "Web Browser", correct: false },
  //       { id: "C", text: "Spreadsheet", correct: false },
  //       { id: "D", text: "Media Player", correct: false },
  //     ],
  //   },
  //   {
  //     id: 10,
  //     question: "What is the smallest unit of data in a computer?",
  //     options: [
  //       { id: "A", text: "Byte", correct: false },
  //       { id: "B", text: "Bit", correct: true },
  //       { id: "C", text: "Nibble", correct: false },
  //       { id: "D", text: "Kilobyte", correct: false },
  //     ],
  //   },
];
