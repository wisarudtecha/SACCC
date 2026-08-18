import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router";

import BroadcastPage from "./broadcast";
import BroadcastLogPage from "./broadcast-log";
import DashboardPage from "./dashboard";
import FilesPage from "./files";
import ArticlesPage from "./articles";
import ArticleDetailPage from "./articles-detail";
import ArticleReviewPage from "./articles-review";
import ArticleFormPage from "./articles-create-update";
import CategoryManagerPage from "./category-manager";
import BannerManagementPage from "./banner-management";
import SourcePage from "./source";
import DetailModal from "./components/broadcast/DetailModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const KBRoutes = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
          <Route path="broadcast-log" element={<BroadcastLogPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/create" element={<ArticleFormPage />} />
          <Route path="articles/edit/:id" element={<ArticleFormPage />} />
          <Route path="articles/:id" element={<ArticleDetailPage />} />
          <Route path="articles/review/:id" element={<ArticleReviewPage />} />
          <Route path="category-manager" element={<CategoryManagerPage />} />
          <Route path="banner-management" element={<BannerManagementPage />} />
          <Route path="source" element={<SourcePage />} />
        </Routes>
        <DetailModal />
      </>
    </QueryClientProvider>
  );
};

export default KBRoutes;
