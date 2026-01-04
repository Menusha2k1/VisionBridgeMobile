import React, { createContext, useState, useContext } from "react";

interface Settings {
  speechRate: number;
  accuracyPadding: number;
  level: "beginner" | "expert";
}

const SettingsContext = createContext<any>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>({
    speechRate: 1.0,
    accuracyPadding: 0,
    level: "expert",
  });

  const updateFromAI = (score: number) => {
    // Threshold 0.5: Higher means the model is confident the student is struggling
    if (score > 0.5) {
      setSettings({ speechRate: 0.7, accuracyPadding: 25, level: "beginner" });
    } else {
      setSettings({ speechRate: 1.0, accuracyPadding: 0, level: "expert" });
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateFromAI }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
