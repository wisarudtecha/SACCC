// components/Toast.tsx
import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // in milliseconds
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message = "error",
  type = "info",
  duration = 3000,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = 30; // update every 30ms
    const totalTicks = duration / interval;
    let ticks = 0;

    const timer = setInterval(() => {
      ticks++;
      setProgress(100 - (ticks / totalTicks) * 100);
    }, interval);

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const baseStyle = "px-4 py-2 rounded shadow-md text-white";
  const typeStyle = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  return (
    <div className={`fixed top-30 right-7 z-99999 ${baseStyle} ${typeStyle}`}>
      {message}
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/70 transition-all ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

};

export default Toast;