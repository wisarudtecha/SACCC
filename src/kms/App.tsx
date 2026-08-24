// src/kms/App.tsx
// React Imports
// import {} from './i18n/i18n'
import "@/kms/i18n/i18n";
import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/core/components/common/ScrollToTop";
import BroadcastPage from "./broadcast";
import BroadcastLogPage from "./broadcast-log";
import DashboardPage from "./dashboard";
import FilesPage from "./files";
import ArticlesPage from "./articles";
import ArticleDetailPage from "./articles-detail";
import ArticleReviewPage from "./articles-review";
import ArticleFormPage from "./articles-create-update";
import CategoryManagerPage from "./category-manager";
import CategoryPage from './categorys'
import BannerManagementPage from "./banner-management";
import SourcePage from "./source";
import DetailModal from "./components/broadcast/DetailModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
// Template Imports
import NotFound from "@/core/pages/OtherPage/NotFound";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function KmsApp() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
    <>
      <ScrollToTop />
      <Routes>
        <Route path="*" element={<NotFound />} />
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
        <Route path="categorys-articles" element={<CategoryPage />} />
        <Route path="banner-management" element={<BannerManagementPage />} />
        <Route path="source" element={<SourcePage />} />
      </Routes>
      <DetailModal />
    </>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
