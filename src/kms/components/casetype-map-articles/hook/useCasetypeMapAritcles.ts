
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  GetCategoryArticleTreeResponseDto,
  CategoryArticleTreeNodeDto,
  ServiceTypeMappingArticlesDto,
  ServiceTypeArticlesDto
} from "@/kms/components/casetype-map-articles/dto/casetype-map-articles.dto";
import {
  getCategoryArticleTree,
  saveServiceToArticle,
  getServiceArticle,
  deleteServiceArticle
} from "@/kms/components/casetype-map-articles/service/casetype-map-articles.service";
import { TreeNode as TreeNodeType } from '@/kms/components/casetype-map-articles/TreeMultiSelect.types';

export const useServiceTypeArticles = (language:string) => {
  const [data, setData] = useState<GetCategoryArticleTreeResponseDto['data']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const hasFetched = useRef(false);
 
  const fetchData = useCallback(async () => {

    // ถ้าเคยโหลดแล้ว ไม่โหลดซ้ำ
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCategoryArticleTree();
      console.log('response',response)
      setData(response.data ?? []);

    } catch (err) {

      console.error(
        '❌ Failed to fetch service type articles:',
        err
      );

      setError(err);

      // ให้ retry ได้ถ้า API error
      hasFetched.current = false;

    } finally {

      setIsLoading(false);

    }

  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // TreeNodeType
  const mapTreeNodes = (
    items: CategoryArticleTreeNodeDto[] | null | undefined
  ): TreeNodeType[] => {
    return (items ?? []).map((item) => ({
      id: String(item.id ?? ''),
      label: language == 'th'?  item.label ?? '':item.label_en ?? '',
      label_th: item.label ?? '',
      label_en: item.label_en ?? '',
      children: mapTreeNodes(item.children),
    }));
  };

  const treeNodes: TreeNodeType[] = mapTreeNodes(data);

  return {
    data: treeNodes,
    isLoading,
    error,
  };
};




export const useSaveServiceTypeArticles = () => {
   const saveServiceTypeArticle = async (input: ServiceTypeMappingArticlesDto) => {
    return await saveServiceToArticle(input);
  };
  return { saveServiceTypeArticle };
 
};

export const useGetServiceTypeArticles =() =>{
 const getServiceTypeArticle = async (input: ServiceTypeArticlesDto) => {
    return await getServiceArticle(input);
  };
  return { getServiceTypeArticle };

}


export const useDelServiceArticle=()=>{
const delServiceTypeArticle = async (input: ServiceTypeArticlesDto) => {
    return await deleteServiceArticle(input);
  };
  return { delServiceTypeArticle };

}
