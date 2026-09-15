// src/cms/components/dashboard/dispatch/EventsFeedWidget.tsx
import React from "react";
import type { SelfFetchingWidgetRenderProps } from "@/core/components/custom-dashboard/widgets/types";
import { CompactWidgetTile } from "@/core/components/custom-dashboard/widgets/CompactWidgetTile";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDispatchEventsFeed } from "@/cms/components/dashboard/dispatch/useDispatchEventsFeed";
import { DispatchEventsList } from "@/cms/components/dashboard/dispatch/DispatchEventsList";

export const EventsFeedWidget: React.FC<SelfFetchingWidgetRenderProps> = ({ compact, icon }) => {
  const { t } = useTranslation();
  const { events, isLoading } = useDispatchEventsFeed();

  if (compact) {
    return (
      <CompactWidgetTile
        icon={icon}
        label={t("dashboard.custom.widgets.events_feed.compact_label")}
        value={events.length}
      />
    );
  }

  return <DispatchEventsList events={events} isLoading={isLoading} />;
};

export default EventsFeedWidget;
