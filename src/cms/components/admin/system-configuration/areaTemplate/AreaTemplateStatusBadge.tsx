// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateStatusBadge.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { TemplateStatus } from "@/cms/types/areaTemplate";
import Badge from "@/core/components/ui/badge/Badge";

interface AreaTemplateStatusBadgeProps {
  status: TemplateStatus;
}

/**
 * Draft vs published is the single most consequential thing about a template -
 * it decides whether anything on the screen can still be edited - so it gets
 * the same colour treatment everywhere it appears.
 */
const AreaTemplateStatusBadge: React.FC<AreaTemplateStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <Badge variant="light" color={status === "published" ? "success" : "warning"}>
      {t(`crud.areaTemplate.status.${status}`)}
    </Badge>
  );
};

export default AreaTemplateStatusBadge;
