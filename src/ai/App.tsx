// src/ai/App.tsx
// React Imports
import { Routes, Route } from "react-router-dom";

// Template Imports
import NotFound from "@/core/pages/OtherPage/NotFound";

export default function AiApp() {
  return (
    <>
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
