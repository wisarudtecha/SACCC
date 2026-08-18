import { useEffect, useState } from "react";

const useFirstVisitNotice = (storageKey: string, contentSignature: string | null | undefined) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!contentSignature) {
      setIsOpen(false);
      return;
    }

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;

    setIsOpen(stored !== contentSignature);
  }, [storageKey, contentSignature]);

  const accept = () => {
    if (contentSignature && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, contentSignature);
    }

    setIsOpen(false);
  };

  return { isOpen, accept };
};

export default useFirstVisitNotice;
