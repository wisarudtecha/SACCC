// src/core/context/SuperAppContext.tsx
import { createContext, useContext } from "react";

const SuperAppContext = createContext(true);

// eslint-disable-next-line react-refresh/only-export-components
export const useSuperApp = () => useContext(SuperAppContext);

export default SuperAppContext;
