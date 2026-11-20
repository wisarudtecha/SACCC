// Owns everything the Place layer needs: the one shared fetch of the org-curated
// dataset, the show/hide toggle, the per-category filters, the current selection,
// and the layer's status line.
//
// Called inside BoundaryMapField, next to useBoundarySelection, for the same
// reason: BoundaryMapField renders a SECOND MapView when expanded, so the state
// has to live ABOVE it or expanding would reset the layer and lose the selected
// marker. Being the single choke point all three case-map surfaces pass through,
// this also means none of those surfaces need to know the Place layer exists.
//
// Selecting a Place marker is informational only - stakeholder decision Q1. This
// hook keeps the selection as local UI state (drives the highlight and the info
// popup) and never surfaces a callback that could write to the case.
//
// THE ORG'S `layers.showPlace` IS THE STARTING POINT, NOT A LOCK (Phase B9 of
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md). The layer still toggles; the setting
// decides what it looks like on arrival. Held as `override ?? orgValue` rather
// than seeded into `useState` on purpose: this hook mounts before the settings
// document has been read, so a mount-time seed would capture the defaults and
// never see the org's choice.
//
// Same reason the categories start open when the org shows Places (decision D12):
// a layer that is on but filters everything out looks identical to a broken
// layer, and the admin who switched it on would have no way to tell.
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useOrgMapSettings } from "@/cms/components/admin/system-configuration/settings/useOrgMapSettings";
import { useGetPlacesQuery } from "@/cms/store/api/placesApi";
import { PLACE_CATEGORIES } from "@/cms/types/place";
import type { PlaceCategory } from "@/cms/types/place";
import { PLACE_FETCH_LIMIT, isPlaceLayerTruncated } from "../mapControlDefaults";
import { toPlaceMarkers, type PlaceMarker, type PlaceSelection } from "./placeTypes";

type CategoryVisibility = Record<PlaceCategory, boolean>;

const ALL_CATEGORIES_HIDDEN: CategoryVisibility = PLACE_CATEGORIES.reduce(
  (visibility, category) => ({ ...visibility, [category]: false }),
  {} as CategoryVisibility
);

const ALL_CATEGORIES_VISIBLE: CategoryVisibility = PLACE_CATEGORIES.reduce(
  (visibility, category) => ({ ...visibility, [category]: true }),
  {} as CategoryVisibility
);

export interface UsePlaceLayerResult {
  /** Markers to draw: category-filtered, but NOT gated on `showPlace` (the layer hook does that via `visible`). */
  places: PlaceMarker[];
  showPlace: boolean;
  toggleShowPlace: () => void;
  categoryVisibility: CategoryVisibility;
  toggleCategory: (category: PlaceCategory) => void;
  selectedPlaceId: string | null;
  /** The selected marker, or null when nothing is selected / the layer is off / it was filtered out. */
  selectedPlace: PlaceMarker | null;
  /** The current selection - a single Place, an unseparable group, or none. */
  selection: PlaceSelection | null;
  /**
   * The group's live members, re-resolved against `places` every render (so
   * panning doesn't go stale), or null while no group is selected.
   */
  groupMarkers: PlaceMarker[] | null;
  selectPlace: (selection: PlaceSelection | null) => void;
  /**
   * The group a Place was picked out of, or null when it was selected
   * directly. Lets the info popup offer a "back to the group" button, mirroring
   * CaseStaffMapField's groupOrigin.
   */
  groupOrigin: readonly string[] | null;
  /** Pick a single Place out of the open group panel, remembering the group. */
  pickFromGroup: (id: string) => void;
  /** Return to the group a Place was picked out of. No-op if there is none. */
  backToGroup: () => void;
  isLoading: boolean;
  isError: boolean;
  /** How many markers the single fetch returned - the Map Settings screen quotes it against the ceiling. */
  loadedCount: number;
  /** True when the fetch may have been cut at `PLACE_FETCH_LIMIT` (decision D9). */
  isTruncated: boolean;
  /** Localised status line for the toolbar (error / nothing to show / partial), or undefined. */
  notice: string | undefined;
}

export function usePlaceLayer(): UsePlaceLayerResult {
  const { language, t } = useTranslation();
  // The org's default for this layer. `loaded` is fully populated in every state
  // (schema defaults while loading / unreadable), so the derived values below are
  // always defined - the map simply renders with the defaults until it settles.
  const { loaded: orgSettings } = useOrgMapSettings();
  const orgShowPlace = orgSettings.layers.showPlace;

  const { data, isLoading, isError } = useGetPlacesQuery({ start: 0, length: PLACE_FETCH_LIMIT });

  // The user's own choice, or null while the org's default still applies.
  const [showPlaceOverride, setShowPlaceOverride] = useState<boolean | null>(null);
  const [categoryVisibilityOverride, setCategoryVisibilityOverride] =
    useState<CategoryVisibility | null>(null);
  const [selection, setSelection] = useState<PlaceSelection | null>(null);
  const [groupOrigin, setGroupOrigin] = useState<readonly string[] | null>(null);

  const showPlace = showPlaceOverride ?? orgShowPlace;
  // Module-level constants, so this reference is stable across renders.
  const initialCategoryVisibility = orgShowPlace
    ? ALL_CATEGORIES_VISIBLE
    : ALL_CATEGORIES_HIDDEN;
  const categoryVisibility = categoryVisibilityOverride ?? initialCategoryVisibility;

  const allMarkers = useMemo(() => toPlaceMarkers(data?.data, language), [data, language]);

  const places = useMemo(
    () => allMarkers.filter((marker) => categoryVisibility[marker.category]),
    [allMarkers, categoryVisibility]
  );

  const selectedPlaceId = selection?.type === "place" ? selection.id : null;

  const selectedPlace = useMemo(
    () => (showPlace ? places.find((marker) => marker.id === selectedPlaceId) ?? null : null),
    [showPlace, places, selectedPlaceId]
  );

  // Re-resolved from live `places` every render, mirroring
  // CaseStaffMapField's groupMarkers: the picker outlives the group that
  // opened it, so panning must not close the card.
  const groupMarkers = useMemo(
    () =>
      showPlace && selection?.type === "group"
        ? places.filter((marker) => selection.placeIds.includes(marker.id))
        : null,
    [showPlace, selection, places]
  );

  const toggleShowPlace = useCallback(() => {
    setShowPlaceOverride((previous) => !(previous ?? orgShowPlace));
    setSelection(null);
    setGroupOrigin(null);
  }, [orgShowPlace]);

  const toggleCategory = useCallback(
    (category: PlaceCategory) => {
      setCategoryVisibilityOverride((previous) => {
        const current = previous ?? initialCategoryVisibility;
        return { ...current, [category]: !current[category] };
      });
    },
    [initialCategoryVisibility]
  );

  // A direct click (map marker or group panel's close/re-selection) always
  // starts a fresh journey - only pickFromGroup below sets groupOrigin.
  const selectPlace = useCallback((next: PlaceSelection | null) => {
    setSelection(next);
    setGroupOrigin(null);
  }, []);

  const pickFromGroup = useCallback(
    (id: string) => {
      if (selection?.type === "group") {
        setGroupOrigin(selection.placeIds);
      }
      setSelection({ type: "place", id });
    },
    [selection]
  );

  const backToGroup = useCallback(() => {
    if (!groupOrigin) {
      return;
    }
    setSelection({ type: "group", placeIds: groupOrigin });
    setGroupOrigin(null);
  }, [groupOrigin]);

  const isTruncated = isPlaceLayerTruncated(allMarkers.length);

  const notice = useMemo(() => {
    if (isError) {
      return t("case.display.map_place_error");
    }
    if (!showPlace || isLoading) {
      return undefined;
    }
    if (allMarkers.length === 0) {
      return t("case.display.map_place_empty");
    }
    // D9 - never truncate silently. A full page means "there may be more", and the
    // operator has to know before concluding a Place is missing from the dataset.
    if (isTruncated) {
      return t("case.display.map_place_truncated", {
        count: allMarkers.length,
        limit: PLACE_FETCH_LIMIT,
      });
    }
    return undefined;
  }, [isError, showPlace, isLoading, allMarkers.length, isTruncated, t]);

  return {
    places,
    showPlace,
    toggleShowPlace,
    categoryVisibility,
    toggleCategory,
    selectedPlaceId,
    selectedPlace,
    selection,
    groupMarkers,
    selectPlace,
    groupOrigin,
    pickFromGroup,
    backToGroup,
    isLoading,
    isError,
    loadedCount: allMarkers.length,
    isTruncated,
    notice
  };
}
