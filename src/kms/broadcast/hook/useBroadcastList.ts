import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import type { BroadcastStatus } from "@/kms/broadcast/dtos/broadcast.dto";
import {
  getBroadcastList,
  getBroadcastHistoryList,
} from "@/kms/broadcast/service/broadcast.service";

const BROADCAST_LIST_LIMIT = 10;

export const useBroadcastList = (status: BroadcastStatus) => {
  const location = useLocation();

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [status]);

  const query = useQuery({
    queryKey: ["kb-broadcast-list", status, page],
    queryFn: () => getBroadcastList(page, BROADCAST_LIST_LIMIT, status),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);
  return { ...query, page, setPage };
};

export const useBroadcastHistoryList = (status: BroadcastStatus) => {
  const location = useLocation();

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const query = useQuery({
    queryKey: ["kb-broadcast-history", status, page],
    queryFn: () => getBroadcastHistoryList(page, BROADCAST_LIST_LIMIT, status),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);
  return { ...query, page, setPage };
};
