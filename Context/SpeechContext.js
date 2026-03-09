// SpeechContext.js
import React, { createContext, useState, useContext } from "react";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [globalRate, setGlobalRate] = useState(1.0); // Default speed

  return (
    <SpeechContext.Provider value={{ globalRate, setGlobalRate }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeechSettings = () => useContext(SpeechContext);
