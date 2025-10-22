import React, { createContext, useState, useContext } from "react";

const StepsCompletionContext = createContext();

export const StepsCompletionProvider = ({ children }) => {
  const [stepsCompletion, setStepsCompletion] = useState({
    step1: false,
    step1b: false,
    step2: false,
    step3: false,
  });

  return (
    <StepsCompletionContext.Provider value={{ stepsCompletion, setStepsCompletion }}>
      {children}
    </StepsCompletionContext.Provider>
  );
};

export const useStepsCompletion = () => useContext(StepsCompletionContext);