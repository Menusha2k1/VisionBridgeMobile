export interface Lesson {
  id: string;
  number: number;
  title: string;
  scope: string;
  topics: string[];
}

export const SYLLABUS_DATA: Record<string, Lesson[]> = {
  "Grade 10": [
    {
      id: "10-1",
      number: 1,
      title: "Information & Communication Technology",
      scope:
        "The role of ICT in national development and the evolution of computing.",
      topics: [
        "ICT Applications (E-Gov, Tele-medicine)",
        "Evolution of Computers",
        "Data vs. Information",
      ],
    },
    {
      id: "10-2",
      number: 2,
      title: "Computer Hardware & Architecture",
      scope:
        "Identification and classification of computer systems and peripherals.",
      topics: [
        "Input/Output Devices",
        "Connectivity Ports (HDMI, USB)",
        "Von Neumann Architecture",
      ],
    },
    {
      id: "10-3",
      number: 3,
      title: "Data Representation",
      scope: "Mathematical foundations of digital data.",
      topics: [
        "Number Systems (Binary to Hex)",
        "Storage Hierarchy",
        "Coding Standards (ASCII, Unicode)",
      ],
    },
    {
      id: "10-4",
      number: 4,
      title: "Logic Gates & Digital Circuits",
      scope: "Boolean algebra and digital logic design.",
      topics: [
        "Fundamental Gates (AND, OR, NOT)",
        "Derived Gates (NAND, NOR)",
        "Truth Tables",
      ],
    },
    {
      id: "10-5",
      number: 5,
      title: "Operating Systems",
      scope: "System software functions and management.",
      topics: [
        "Core Functions (Memory, File Mgmt)",
        "OS Classifications",
        "System Utilities",
      ],
    },
    {
      id: "10-6",
      number: 6,
      title: "Database Management Systems",
      scope: "Theory and application of relational databases.",
      topics: [
        "Field, Record, Table",
        "Primary & Foreign Keys",
        "Database Integrity",
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
        "Pascal Syntax",
        "Data Types & Operators",
        "Control Structures (IF, FOR, WHILE)",
      ],
    },
    {
      id: "11-8",
      number: 8,
      title: "Systems Development Life Cycle (SDLC)",
      scope: "Phases of software engineering and information systems.",
      topics: ["SDLC Stages", "Deployment Strategies"],
    },
    {
      id: "11-9",
      number: 9,
      title: "Internet & Networking",
      scope: "Network infrastructure and communication protocols.",
      topics: ["IP, URL, DNS", "Client-Server Model", "Email & Web Protocols"],
    },
    {
      id: "11-10",
      number: 10,
      title: "Web Development",
      scope: "Website structure and authoring.",
      topics: ["HTML Standards", "Static vs Dynamic Pages", "CMS (Joomla)"],
    },
    {
      id: "11-11",
      number: 11,
      title: "ICT & Society",
      scope: "Legal, ethical, and health implications of technology.",
      topics: ["Computer Crimes Act", "Ergonomics & Health", "Cyber Security"],
    },
  ],
};
