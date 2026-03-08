export interface Lesson {
  id: string;
  number: number;
  title: string;
  scope: string;
  topics: { id: string; title: string }[]; // changed from string[] to object[]
}

export interface Quiz {
  id: string;
  lessonId: string;
  lessonName: string;
  questionsCount: number;
}

export const QUIZZES_DATA: Record<string, Quiz[]> = {
  "Grade 10": [
    {
      id: "q1",
      lessonId: "10-1",
      lessonName: "ICT & National Development",
      questionsCount: 10,
    },
    {
      id: "q2",
      lessonId: "10-2",
      lessonName: "Hardware Architecture",
      questionsCount: 15,
    },
    {
      id: "q4",
      lessonId: "10-4",
      lessonName: "Logic Gates",
      questionsCount: 12,
    },
  ],
  "Grade 11": [
    {
      id: "q7",
      lessonId: "11-7",
      lessonName: "Pascal Programming",
      questionsCount: 20,
    },
    {
      id: "q9",
      lessonId: "11-9",
      lessonName: "Networking",
      questionsCount: 10,
    },
  ],
};

export const SYLLABUS_DATA: Record<string, Lesson[]> = {
  "Grade 10": [
    {
      id: "10-1",
      number: 1,
      title: "Information & Communication Technology",
      scope:
        "The role of ICT in national development and the evolution of computing.",
      topics: [
        { id: "10-1-1", title: "ICT Applications (E-Gov, Tele-medicine)" },
        { id: "10-1-2", title: "Evolution of Computers" },
        { id: "10-1-3", title: "Data vs. Information" },
      ],
    },
    {
      id: "10-2",
      number: 2,
      title: "Computer Hardware & Architecture",
      scope:
        "Identification and classification of computer systems and peripherals.",
      topics: [
        { id: "10-2-1", title: "Input/Output Devices" },
        { id: "10-2-2", title: "Connectivity Ports (HDMI, USB)" },
        { id: "10-2-3", title: "Von Neumann Architecture" },
      ],
    },
    {
      id: "10-3",
      number: 3,
      title: "Data Representation",
      scope: "Mathematical foundations of digital data.",
      topics: [
        { id: "10-3-1", title: "Number Systems (Binary to Hex)" },
        { id: "10-3-2", title: "Storage Hierarchy" },
        { id: "10-3-3", title: "Coding Standards (ASCII, Unicode)" },
      ],
    },
    {
      id: "10-4",
      number: 4,
      title: "Logic Gates & Digital Circuits",
      scope: "Boolean algebra and digital logic design.",
      topics: [
        { id: "10-4-1", title: "Fundamental Gates (AND, OR, NOT)" },
        { id: "10-4-2", title: "Derived Gates (NAND, NOR)" },
        { id: "10-4-3", title: "Truth Tables" },
      ],
    },
    {
      id: "10-5",
      number: 5,
      title: "Operating Systems",
      scope: "System software functions and management.",
      topics: [
        { id: "10-5-1", title: "Core Functions (Memory, File Mgmt)" },
        { id: "10-5-2", title: "OS Classifications" },
        { id: "10-5-3", title: "System Utilities" },
      ],
    },
    {
      id: "10-6",
      number: 6,
      title: "Database Management Systems",
      scope: "Theory and application of relational databases.",
      topics: [
        { id: "10-6-1", title: "Field, Record, Table" },
        { id: "10-6-2", title: "Primary & Foreign Keys" },
        { id: "10-6-3", title: "Database Integrity" },
      ],
    },
  ],
  "Grade 11": [
    {
      id: "11-7",
      number: 7,
      title: "Programming (Pascal Focus)",
      scope: "Algorithmic problem solving and structured programming.",
      topics: [
        { id: "11-7-1", title: "Pascal Syntax" },
        { id: "11-7-2", title: "Data Types & Operators" },
        { id: "11-7-3", title: "Control Structures (IF, FOR, WHILE)" },
      ],
    },
    {
      id: "11-8",
      number: 8,
      title: "Systems Development Life Cycle (SDLC)",
      scope: "Phases of software engineering and information systems.",
      topics: [
        { id: "11-8-1", title: "SDLC Stages" },
        { id: "11-8-2", title: "Deployment Strategies" },
      ],
    },
    {
      id: "11-9",
      number: 9,
      title: "Internet & Networking",
      scope: "Network infrastructure and communication protocols.",
      topics: [
        { id: "11-9-1", title: "IP, URL, DNS" },
        { id: "11-9-2", title: "Client-Server Model" },
        { id: "11-9-3", title: "Email & Web Protocols" },
      ],
    },
  ],
};
