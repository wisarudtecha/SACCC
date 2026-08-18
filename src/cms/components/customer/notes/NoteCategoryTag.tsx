// src/cms/components/customer/notes/NoteCategoryTag.tsx
import Badge from "@/core/components/ui/badge/Badge";
import { useTranslation } from "@/core/hooks/useTranslation";
import { i18nNoteCategory, noteCategoryColor } from "@/cms/components/customer/notes/noteCategoryDisplay";
import type { NoteCategory } from "@/cms/types/customerNote";

interface NoteCategoryTagProps {
  category: NoteCategory;
  className?: string;
}

/**
 * The category badge on a note card. `Badge` already carries its own dark-mode
 * variants, so the colour mapping is all this needs to add.
 */
export const NoteCategoryTag = ({ category, className = "" }: NoteCategoryTagProps) => {
  const { t } = useTranslation();

  return (
    <Badge
      variant="light"
      size="xs"
      color={noteCategoryColor(category)}
      className={className}
    >
      {i18nNoteCategory(t, category)}
    </Badge>
  );
};

export default NoteCategoryTag;
