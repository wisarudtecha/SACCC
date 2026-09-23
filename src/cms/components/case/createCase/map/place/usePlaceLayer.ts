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
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetPlacesQuery } from "@/cms/store/api/placesApi";
import { PLACE_CATEGORIES } from "@/cms/types/place";
import type { PlaceCategory } from "@/cms/types/place";
import { toPlaceMarkers, type PlaceMarker, type PlaceSelection } from "./placeTypes";

// The dataset is small and org-curated; there is no viewport scoping for Place
// (ticket Section 7 - "one shared fetch, like boundaries"). RTK Query dedupes
// this across the inline + expanded maps and every surface. Known limit: an org
// with more Places than this would be silently truncated.
const PLACE_FETCH_LIMIT = 1000;

type CategoryVisibility = Record<PlaceCategory, boolean>;

const ALL_CATEGORIES_HIDDEN: CategoryVisibility = PLACE_CATEGORIES.reduce(
  (visibility, category) => ({ ...visibility, [category]: false }),
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
  /** Localised status line for the toolbar (error / nothing to show), or undefined. */
  notice: string | undefined;
}

export function usePlaceLayer(): UsePlaceLayerResult {
  const { language, t } = useTranslation();
  const { data, isLoading, isError } = useGetPlacesQuery({ start: 0, length: PLACE_FETCH_LIMIT });

  // Reset every time (ticket Decision 6): the layer starts hidden, every
  // category starts unchecked too (mirrors the Boundaries picker's
  // nothing-selected default), nothing persists across mounts.
  const [showPlace, setShowPlace] = useState(false);
  const [categoryVisibility, setCategoryVisibility] =
    useState<CategoryVisibility>(ALL_CATEGORIES_HIDDEN);
  const [selection, setSelection] = useState<PlaceSelection | null>(null);
  const [groupOrigin, setGroupOrigin] = useState<readonly string[] | null>(null);

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
    setShowPlace((on) => !on);
    setSelection(null);
    setGroupOrigin(null);
  }, []);

  const toggleCategory = useCallback((category: PlaceCategory) => {
    setCategoryVisibility((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

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

  const notice = useMemo(() => {
    if (isError) {
      return t("case.display.map_place_error");
    }
    if (showPlace && !isLoading && allMarkers.length === 0) {
      return t("case.display.map_place_empty");
    }
    return undefined;
  }, [isError, showPlace, isLoading, allMarkers.length, t]);

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
    notice
  };
}
