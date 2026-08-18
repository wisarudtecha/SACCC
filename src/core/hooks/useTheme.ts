// /src/hooks/useTheme.ts
import { useState } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState("light");
  const isInitialized = true;
  
  const toggleTheme = () => {
    const themes = ["light", "dark", "mioc", "metthier"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const variant = {
    primary: theme === "dark" ? "#0bcfce" : "#0bcfce",
    secondary: theme === "dark" ? "#114a50" : "#3bada9",
    accent: theme === "dark" ? "#ff8311" : "#fd6e2b",
    background: theme === "dark" ? "#15181c" : "#ffffff",
    surface: theme === "dark" ? "#114a50" : "#ffffff",
    text: theme === "dark" ? "#ffffff" : "#000000",
    border: theme === "dark" ? "#0b0e14" : "#e5ebf6"
  };

  return { theme, variant, toggleTheme, setTheme, isInitialized };
};
