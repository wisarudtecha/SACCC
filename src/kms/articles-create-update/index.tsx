import { useNavigate, useParams } from "react-router";
import PageMeta from "@/kms/components/common/PageMeta";
import ArticleCreateForm from "@/kms/components/articles/ArticleCreateForm";

const ArticleFormPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const handleSuccess = (_savedId: string) => {
    navigate("/kms/articles");
  };

  return (
    <>
      <PageMeta
        title={isEditMode ? "Edit Article" : "Create Article"}
        description={
          isEditMode ? "แก้ไขบทความในฐานความรู้" : "สร้างบทความใหม่ในฐานความรู้"
        }
      />
      <ArticleCreateForm editId={id} onSuccess={handleSuccess} />
    </>
  );
};

export default ArticleFormPage;
