const API_BASE = "http://172.20.10.2:3000/api"; // Android emulator → localhost
// Use your machine's IP (e.g. "http://192.168.1.x:3000/api") for physical device

export const apiLogin = async (pin: string) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }
  return data.student; // { id, name, grade }
};

export const apiSaveLog = async (log: {
  student_id: number;
  screen_name: string;
  user_path: string;
  prediction_label: string;
}) => {
  const response = await fetch(`${API_BASE}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data.error || "Failed to save log");
  }
  return data;
};

export const getStudentReport = async (studentId: number) => {
  const response = await fetch(`${API_BASE}/reports/${studentId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch report");
  }
  return data; // { student, totalLogs, logs }
};
