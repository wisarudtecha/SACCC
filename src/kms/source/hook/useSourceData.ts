import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getSourceList } from "@/kms/source/service/source.service";

const SOURCE_LIST_LIMIT = 10;

export const useSourceData = () => {
  const location = useLocation();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["kb-source-list", page],
    queryFn: () => getSourceList(page, SOURCE_LIST_LIMIT),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);
  return { ...query, page, setPage };
};
