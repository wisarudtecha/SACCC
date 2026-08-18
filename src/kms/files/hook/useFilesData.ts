import { useQuery } from "@tanstack/react-query";

import { FileBlockDataMap, FileBlockKey } from "@/kms/files/dtos/files.dto";
import { getFileBlock } from "@/kms/files/service/files.service";

export const useFileBlockData = <K extends FileBlockKey>(
  block: K,
  options?: { prefix?: string },
) =>
  useQuery({
    queryKey: ["kb-files-block", block, options?.prefix ?? ""],
    queryFn: () => getFileBlock(block, options),
    staleTime: 1000 * 60 * 3,
  }) as {
    data?: {
      data: FileBlockDataMap[K];
      meta: { endpoint: string; source: "mock" | "api" };
    };
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };
