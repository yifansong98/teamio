import React, { createContext, useState, useContext } from "react";

const StepsCompletionContext = createContext();

export const StepsCompletionProvider = ({ children }) => {
  const [stepsCompletion, setStepsCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false, // Map All Logins to UserIDs
    step5: false, // Annotate Contributions
    step6: false, // Team Reflection
  });

  return (
    <StepsCompletionContext.Provider value={{ stepsCompletion, setStepsCompletion }}>
      {children}
    </StepsCompletionContext.Provider>
  );
};

export const useStepsCompletion = () => useContext(StepsCompletionContext);