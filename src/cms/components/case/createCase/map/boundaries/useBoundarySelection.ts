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
// This must be called ABOVE AddressMapField. That component renders a
// second MapView when expanded, so state owned any lower would reset the moment
// the user expanded the map - the same reason CaseStaffMapField owns the staff
// state rather than letting the map own it.
import { useCallback, useEffect, useMemo, useState } from "react";
import { boundarySource } from "./boundarySource";
import { ADMIN_LEVELS, BOUNDARY_LEVELS } from "./boundaryLevels";
import { expandAuthorizedScope, type AuthorizedScope } from "./boundaryAuthorizedScope";
import {
  EMPTY_BOUNDARY_INDEX,
  EMPTY_BOUNDARY_SELECTION,
  type AdminLevel,
  type BoundaryIndex,
  type BoundaryLayerConfig,
  type BoundaryOption,
  type BoundarySelection,
  type BoundaryVisibility
} from "./boundaryTypes";

/**
 * Exactly one level starts on - the one the active table marks defaultVisible
 * (province for the org data, district for the local files). Three sets of
 * polygons at once is a lot to hand someone who only opened a case form, so the
 * rest are opt-in.
 *
 * Derived rather than written out, because the two sources do not share level
 * names and a literal here would silently mean different things under each.
 */
const DEFAULT_VISIBILITY: BoundaryVisibility = BOUNDARY_LEVELS.reduce<BoundaryVisibility>(
  (visibility, config) => ({ ...visibility, [config.level]: config.defaultVisible }),
  { country: false, province: false, district: false, subdistrict: false }
);

/**
 * Every level off except District. Used instead of DEFAULT_VISIBILITY when the
 * caller asks for manual-only defaults (case create/assignment - see
 * `startAllHidden`). District starts as the active level so the toolbar isn't
 * presented with nothing selected, but - unlike DEFAULT_VISIBILITY, which also
 * pre-selects every area under its default level (see `selectAll` below) -
 * nothing is pre-checked under it: `applied`/`draft` still start empty, so no
 * polygon draws until the dispatcher actually picks areas.
 */
const MANUAL_DEFAULT_VISIBILITY: BoundaryVisibility = {
  country: false,
  province: false,
  district: true,
  subdistrict: false
};

type OptionsByLevel = Readonly<Record<AdminLevel, readonly BoundaryOption[]>>;

const EMPTY_OPTIONS: OptionsByLevel = EMPTY_BOUNDARY_INDEX;

export interface UseBoundarySelectionOptions {
  /**
   * Start every level unselected, and every level but District hidden,
   * instead of the one `defaultVisible` level with everything under it
   * selected. The case create/assignment screens pass this so no polygon
   * appears until the user has explicitly asked for it (REQ 3/4) - other
   * BoundaryMapField consumers (e.g. the read-only Case Preview map) keep the
   * historical auto-default.
   */
  startAllHidden?: boolean;
  /**
   * The dispatcher's authorized District ids (see useAuthorizedDistrictIds).
   * When non-empty, the loaded index is narrowed to those districts plus the
   * provinces/countries they roll up into, so the picker only offers areas
   * within the dispatcher's own responsibility (REQ 5). Empty/omitted is
   * unrestricted.
   */
  authorizedDistrictIds?: readonly string[];
}

export interface UseBoundarySelectionResult {
  /** Hand straight to AddressMapField's `boundaries` prop. */
  boundaries: BoundaryLayerConfig;
  visibility: BoundaryVisibility;
  toggleLevel: (level: AdminLevel) => void;
  /** Cascaded option lists for the picker. */
  options: OptionsByLevel;
  /** The selection being edited. */
  draft: BoundarySelection;
  toggleCode: (level: AdminLevel, code: string) => void;
  setLevelCodes: (level: AdminLevel, codes: readonly string[]) => void;
  /**
   * Force the District level on and add `code` to its selection, on top of
   * whatever the user has already chosen. Used by the case-assignment screen
   * to auto-show the district a resolved Service Center match falls in (REQ
   * 4), even under `startAllHidden`. Additive by design: it must not clear a
   * boundary the dispatcher picked manually.
   */
  showDistrict: (code: string) => void;
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

/** Narrows an index to the codes an authorized scope allows, level by level. */
function restrictBoundaryIndex(index: BoundaryIndex, scope: AuthorizedScope): BoundaryIndex {
  return ADMIN_LEVELS.reduce<BoundaryIndex>((restricted, level) => {
    const allowed = scope[level];
    return {
      ...restricted,
      [level]: allowed ? index[level].filter((option) => allowed.has(option.code)) : index[level]
    };
  }, EMPTY_BOUNDARY_INDEX);
}

function selectAll(index: BoundaryIndex): BoundarySelection {
  return ADMIN_LEVELS.reduce<BoundarySelection>(
    (selection, level) => ({ ...selection, [level]: index[level].map((option) => option.code) }),
    EMPTY_BOUNDARY_SELECTION
  );
}

/**
 * Drop child selections whose parent is no longer selected.
 *
 * Without this, deselecting a province would leave its districts selected but
 * unreachable in the picker - they would vanish from the list while still
 * drawing on the map, which reads as a bug.
 *
 * Walks the active levels top-down, carrying the set of codes that survived the
 * level above; the top level has no parent to answer to and passes through
 * untouched. Written as a fold over ADMIN_LEVELS rather than three named steps
 * so it holds for whichever three levels the active source declares.
 */
function pruneOrphans(index: BoundaryIndex, draft: BoundarySelection): BoundarySelection {
  let keptParents: Set<string> | null = null;
  const pruned: Record<string, readonly string[]> = {};

  for (const level of ADMIN_LEVELS) {
    if (keptParents === null) {
      pruned[level] = draft[level];
    }
    else {
      // Copied to a const so it narrows inside the callback - TypeScript widens
      // a `let` back to its declared type across a closure boundary.
      const parents = keptParents;
      // Reachable codes at this level: those whose parent survived above.
      const reachable = new Set(
        index[level]
          .filter((option) => option.parent !== null && parents.has(option.parent))
          .map((option) => option.code)
      );
      pruned[level] = draft[level].filter((code) => reachable.has(code));
    }
    keptParents = new Set(pruned[level]);
  }

  return { ...EMPTY_BOUNDARY_SELECTION, ...pruned };
}

export function useBoundarySelection(
  hookOptions: UseBoundarySelectionOptions = {}
): UseBoundarySelectionResult {
  const { startAllHidden = false, authorizedDistrictIds } = hookOptions;

  const [index, setIndex] = useState<BoundaryIndex | null>(null);
  const [applied, setApplied] = useState<BoundarySelection>(EMPTY_BOUNDARY_SELECTION);
  const [draft, setDraft] = useState<BoundarySelection>(EMPTY_BOUNDARY_SELECTION);
  const [visibility, setVisibility] = useState<BoundaryVisibility>(
    startAllHidden ? MANUAL_DEFAULT_VISIBILITY : DEFAULT_VISIBILITY
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Everything starts selected, so switching a level on shows that whole level
  // rather than an empty map the user has to go and populate by hand. Clearing
  // a level is then an explicit act, and "cleared" genuinely means "draw none"
  // (see buildDefinitionExpression). Under `startAllHidden` nothing starts
  // selected either - District is the one level switched on, but with no areas
  // checked under it, so there is nothing to draw until the dispatcher picks
  // some.
  useEffect(() => {
    let isStale = false;
    boundarySource.loadIndex().then((loaded) => {
      if (isStale) {
        return;
      }
      const scope = authorizedDistrictIds ? expandAuthorizedScope(loaded, authorizedDistrictIds) : {};
      const scoped = restrictBoundaryIndex(loaded, scope);
      const everything = startAllHidden ? EMPTY_BOUNDARY_SELECTION : selectAll(scoped);
      setIndex(scoped);
      setApplied(everything);
      setDraft(everything);
    });
    return () => {
      isStale = true;
    };
  }, [startAllHidden, authorizedDistrictIds]);

  const options = useMemo<OptionsByLevel>(() => {
    if (!index) {
      return EMPTY_OPTIONS;
    }
    // Cascade off the DRAFT, not the applied selection: the lists have to react
    // as the user edits, otherwise narrowing a province would appear to do
    // nothing until Apply.
    //
    // Each level narrows by what is SELECTED above it, not merely by what is
    // available above it. Filtering the finest level by "everything under the
    // selected top level" would still list all 180 of Bangkok's sub-districts
    // whenever Bangkok was ticked, which is exactly the list the cascade exists
    // to avoid. This also mirrors pruneOrphans, which drops the selection of any
    // child whose parent is deselected.
    //
    // Same top-down walk as pruneOrphans, over whichever levels are active.
    const narrowed: Record<string, readonly BoundaryOption[]> = {};
    let selectedParents: Set<string> | null = null;

    for (const level of ADMIN_LEVELS) {
      if (selectedParents === null) {
        narrowed[level] = index[level];
      }
      else {
        const parents = selectedParents;
        narrowed[level] = index[level].filter(
          (option) => option.parent !== null && parents.has(option.parent)
        );
      }
      selectedParents = new Set(draft[level]);
    }

    return { ...EMPTY_OPTIONS, ...narrowed };
    // Keyed on the whole draft rather than on the parent levels individually:
    // which levels are "parents" depends on the active table, and recomputing a
    // few hundred filtered options when only the finest level changed is
    // cheaper than the machinery to avoid it.
  }, [index, draft]);

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

  const showDistrict = useCallback((code: string) => {
    setVisibility((current) => (current.district ? current : { ...current, district: true }));
    const addCode = (selection: BoundarySelection): BoundarySelection =>
      selection.district.includes(code)
        ? selection
        : { ...selection, district: [...selection.district, code] };
    setApplied(addCode);
    setDraft(addCode);
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
    showDistrict,
    isDirty,
    apply,
    cancel,
    isLoading: index === null,
    isPanelOpen,
    openPanel,
    closePanel
  };
}
