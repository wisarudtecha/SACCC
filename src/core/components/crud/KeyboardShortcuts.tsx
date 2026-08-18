// /src/components/crud/KeyboardShortcuts.tsx
import React, { useEffect } from "react";
import type { KeyboardShortcut } from "@/core/types/enhanced-crud";

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  enabled = true
}) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => {
        const modifierMatch = !s.modifier || 
          (s.modifier === "ctrl" && event.ctrlKey) ||
          (s.modifier === "alt" && event.altKey) ||
          (s.modifier === "shift" && event.shiftKey);
        
        return modifierMatch && event.key.toLowerCase() === s.key.toLowerCase();
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);

  return null; // This component doesn"t render anything
};
