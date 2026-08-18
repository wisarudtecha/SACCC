import { useCallback, useState } from "react";
import { uploadFileMultipart } from "../service/files.service";
import type { UploadTask } from "../service/files.service";

export const useUploadManager = (onUploadComplete?: () => void) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const update = (id: string, patch: Partial<UploadTask>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addUpload = useCallback(
    async (file: File, folder: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setTasks((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          folder,
          totalBytes: file.size,
          bytesUploaded: 0,
          speed: 0,
          status: "uploading",
        },
      ]);

      try {
        await uploadFileMultipart(file, folder, ({ bytesUploaded, speed }) => {
          update(id, { bytesUploaded, speed });
        });
        update(id, { status: "done", bytesUploaded: file.size, speed: 0 });
        onUploadComplete?.();
      } catch (err) {
        update(id, { status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    },
    [onUploadComplete],
  );

  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
  }, []);

  return { tasks, addUpload, dismissTask, clearDone };
};
