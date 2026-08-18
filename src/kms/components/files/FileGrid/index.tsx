import React from "react";
import FileManagerPanel from "../FileManagerPanel";

interface FileGridProps {
  currentPath?: string;
  onFolderSelect?: (path: string) => void;
}

// FileGrid is now a thin wrapper — FileManagerPanel owns all state internally.
// currentPath/onFolderSelect props are kept for legacy call sites but no longer
// needed (the panel manages its own path state with a built-in sidebar).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FileGrid: React.FC<FileGridProps> = (_props) => (
  <FileManagerPanel heightCls="min-h-[520px]" />
);

export default FileGrid;
