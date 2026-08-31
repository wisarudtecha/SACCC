


import { useMutation, useQuery } from "@tanstack/react-query";
import type { ArticleFormInput, ArticleStatusInput } from "@/kms/articles-create-update/dtos/article-form.dto";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  getArticleFormDetail,
  saveArticleForm,
  saveArticleStatus
} from "@/kms/articles-create-update/service/article-form.service";

export const useArticleFormDetail = (id: string | undefined) => {
  const location = useLocation();
  const query = useQuery({
    queryKey: ["kb-article-form-detail", id],
    queryFn: () => getArticleFormDetail(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}

export const useSaveArticleForm = () =>
  useMutation({
    mutationFn: ({
      input,
      editId,
    }: {
      input: ArticleFormInput;
      editId?: string;
    }) => saveArticleForm(input, editId),
  });


export const useSaveArticleStatus = () =>
  useMutation({
    mutationFn: ({ input }: { input: ArticleStatusInput; }) => saveArticleStatus(input),
  });
