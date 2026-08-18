// Owns which administrative areas the map draws, and which levels are on.
//
// TWO separate pieces of state, because they answer to different rules:
//
//   applied  - what the map draws. Only ever changes when the user presses
//              Apply, per the requirement that the polygons must not move until
//              the selection is confirmed.
//   draft    - what the picker is editing. Thrown away on Cancel.
//
// Level VISIBILITY is deliberately not part of that: toggling a level is
// instant, so it writes straight through to the applied config.
//
// This must be called ABOVE ArcgisAddressMapField. That component renders a
// second MapView when expanded, so state owned any lower would reset the moment
// the user expanded the map - the same reason CaseStaffMapField owns the staff
// state rather than letting the map own it.
import { useCallback, useEffect, useMemo, useState } from "react";
import { boundarySource } from "./boundarySource";
import {
  ADMIN_LEVELS,
  EMPTY_BOUNDARY_SELECTION,
  type AdminLevel,
  type BoundaryIndex,
  type BoundaryLayerConfig,
  type BoundaryOption,
  type BoundarySelection,
  type BoundaryVisibility
} from "./boundaryTypes";

/**
 * District is the level a dispatcher works in, so it is the one that starts on.
 * The other two are opt-in - three sets of polygons at once is a lot to hand
 * someone who only opened a case form.
 */
const DEFAULT_VISIBILITY: BoundaryVisibility = {
  province: false,
  district: true,
  subdistrict: false
};

type OptionsByLevel = Readonly<Record<AdminLevel, readonly BoundaryOption[]>>;

const EMPTY_OPTIONS: OptionsByLevel = { province: [], district: [], subdistrict: [] };

export interface UseBoundarySelectionResult {
  /** Hand straight to ArcgisAddressMapField's `boundaries` prop. */
  boundaries: BoundaryLayerConfig;
  visibility: BoundaryVisibility;
  toggleLevel: (level: AdminLevel) => void;
  /** Cascaded option lists for the picker. */
  options: OptionsByLevel;
  /** The selection being edited. */
  draft: BoundarySelection;
  toggleCode: (level: AdminLevel, code: string) => void;
  setLevelCodes: (level: AdminLevel, codes: readonly string[]) => void;
  /** True when draft and applied differ, i.e. Apply would change the map. */
  isDirty: boolean;
  apply: () => void;
  cancel: () => void;
  isLoading: boolean;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

/** Order-insensitive comparison - the picker may reorder as it filters. */
function sameCodes(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const seen = new Set(a);
  return b.every((code) => seen.has(code));
}

function selectAll(index: BoundaryIndex): BoundarySelection {
  return {
    province: index.province.map((option) => option.code),
    district: index.district.map((option) => option.code),
    subdistrict: index.subdistrict.map((option) => option.code)
  };
}

/**
 * Drop child selections whose parent is no longer selected.
 *
 * Without this, deselecting a province would leave its districts selected but
 * unreachable in the picker - they would vanish from the list while still
 * drawing on the map, which reads as a bug.
 */
function pruneOrphans(index: BoundaryIndex, draft: BoundarySelection): BoundarySelection {
  const provinces = new Set(draft.province);
  const districts = new Set(
    index.district
      .filter((option) => option.parent !== null && provinces.has(option.parent))
      .map((option) => option.code)
  );
  const nextDistricts = draft.district.filter((code) => districts.has(code));

  const keptDistricts = new Set(nextDistricts);
  const subdistricts = new Set(
    index.subdistrict
      .filter((option) => option.parent !== null && keptDistricts.has(option.parent))
      .map((option) => option.code)
  );
  const nextSubdistricts = draft.subdistrict.filter((code) => subdistricts.has(code));

  return {
    province: draft.province,
    district: nextDistricts,
    subdistrict: nextSubdistricts
  };
}

export function useBoundarySelection(): UseBoundarySelectionResult {
  const [index, setIndex] = useState<BoundaryIndex | null>(null);
  const [applied, setApplied] = useState<BoundarySelection>(EMPTY_BOUNDARY_SELECTION);
  const [draft, setDraft] = useState<BoundarySelection>(EMPTY_BOUNDARY_SELECTION);
  const [visibility, setVisibility] = useState<BoundaryVisibility>(DEFAULT_VISIBILITY);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Everything starts selected, so switching a level on shows that whole level
  // rather than an empty map the user has to go and populate by hand. Clearing
  // a level is then an explicit act, and "cleared" genuinely means "draw none"
  // (see buildDefinitionExpression).
  useEffect(() => {
    let isStale = false;
    boundarySource.loadIndex().then((loaded) => {
      if (isStale) {
        return;
      }
      const everything = selectAll(loaded);
      setIndex(loaded);
      setApplied(everything);
      setDraft(everything);
    });
    return () => {
      isStale = true;
    };
  }, []);

  const options = useMemo<OptionsByLevel>(() => {
    if (!index) {
      return EMPTY_OPTIONS;
    }
    // Cascade off the DRAFT, not the applied selection: the lists have to react
    // as the user edits, otherwise narrowing a province would appear to do
    // nothing until Apply.
    //
    // Each level narrows by what is SELECTED above it, not merely by what is
    // available above it. Filtering sub-districts by "districts in the selected
    // provinces" would still list all 180 of Bangkok's whenever Bangkok was
    // ticked, which is exactly the list the cascade exists to avoid - and at
    // country scale that would be ~7,255 rows. This also mirrors pruneOrphans,
    // which drops the selection of any child whose parent is deselected.
    const provinces = new Set(draft.province);
    const districts = index.district.filter(
      (option) => option.parent !== null && provinces.has(option.parent)
    );
    const selectedDistricts = new Set(draft.district);
    const subdistricts = index.subdistrict.filter(
      (option) => option.parent !== null && selectedDistricts.has(option.parent)
    );
    return { province: index.province, district: districts, subdistrict: subdistricts };
  }, [index, draft.province, draft.district]);

  const updateDraft = useCallback(
    (level: AdminLevel, codes: readonly string[]) => {
      setDraft((current) => {
        const next: BoundarySelection = { ...current, [level]: codes };
        return index ? pruneOrphans(index, next) : next;
      });
    },
    [index]
  );

  const toggleCode = useCallback(
    (level: AdminLevel, code: string) => {
      setDraft((current) => {
        const codes = current[level];
        const next: BoundarySelection = {
          ...current,
          [level]: codes.includes(code)
            ? codes.filter((entry) => entry !== code)
            : [...codes, code]
        };
        return index ? pruneOrphans(index, next) : next;
      });
    },
    [index]
  );

  const toggleLevel = useCallback((level: AdminLevel) => {
    setVisibility((current) => ({ ...current, [level]: !current[level] }));
  }, []);

  const isDirty = useMemo(
    () => ADMIN_LEVELS.some((level) => !sameCodes(draft[level], applied[level])),
    [draft, applied]
  );

  const apply = useCallback(() => {
    setApplied(draft);
    setIsPanelOpen(false);
  }, [draft]);

  const cancel = useCallback(() => {
    setDraft(applied);
    setIsPanelOpen(false);
  }, [applied]);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  // Closing without applying is a cancel: the draft must not survive as a
  // half-edited state the user can no longer see.
  const closePanel = useCallback(() => {
    setDraft(applied);
    setIsPanelOpen(false);
  }, [applied]);

  const boundaries = useMemo<BoundaryLayerConfig>(
    () => ({ selection: applied, visibility }),
    [applied, visibility]
  );

  return {
    boundaries,
    visibility,
    toggleLevel,
    options,
    draft,
    toggleCode,
    setLevelCodes: updateDraft,
    isDirty,
    apply,
    cancel,
    isLoading: index === null,
    isPanelOpen,
    openPanel,
    closePanel
  };
}
