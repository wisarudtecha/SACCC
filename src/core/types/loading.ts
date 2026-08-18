// /src/types/loading.ts
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "primary" | "secondary" | "white" | "gray";
}

export interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export interface ShimmerProps {
  children: React.ReactNode;
  isLoading: boolean;
  lines?: number;
  className?: string;
}

export interface LoadingStateProps {
  type: "spinner" | "skeleton" | "shimmer" | "progress";
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  progress?: number;
  className?: string;
}
