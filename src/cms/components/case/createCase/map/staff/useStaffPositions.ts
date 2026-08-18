// Staff positions for the case map: a per-case snapshot, kept current by the MOB
// websocket events.
//
// Transport:
//   1. The snapshot comes from the existing dispatch query. It is REST-shaped but
//      runs as the `GetUnitDispatch` GraphQL operation whenever VITE_USE_GRAPHQL
//      is on - see createHybridBaseQuery / GQL_MAP. Nothing extra is needed here
//      for either transport.
//   2. MOB events (see mobEvents.ts) come in two kinds, and they are handled
//      differently on purpose:
//        - TRACKING states where the unit IS. It is applied and nothing is
//          refetched, because there is nothing left for the server to add.
//        - STATUS / UNIT_SELECT each state a single field. That field is applied
//          at once so the marker recolours immediately, and a debounced refetch
//          follows for everything the event does NOT carry.
//   3. The refresh button re-runs (1) on demand, rate-limited to one press per
//      STAFF_REFRESH_COOLDOWN_MS.
//   4. A slow safety-net refetch covers roster drift - see ROSTER_SAFETY_REFETCH_MS.
//
// Two design rules worth stating, because both are easy to undo by accident:
//
//   Patches are PARTIAL UNITS, merged before toStaffMarkers runs. Socket data
//   therefore passes through the same guards as the REST snapshot, and a unit
//   whose only known position arrived over the socket can be drawn at all - see
//   the UnitPatch doc comment in staffTypes.ts.
//
//   Position patches are expired by TIME, not wiped on every snapshot. At
//   TRACKING cadence a response routinely carries an older position than the
//   newest socket event, and clearing wholesale would rubber-band the marker
//   backwards. Field patches keep the old wipe-on-snapshot rule, because for
//   status and crew the snapshot genuinely is authoritative.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetUnitQuery } from "@/cms/store/api/dispatch";
import type { Unit } from "@/cms/types/dispatch";
import type { UnitStatus } from "@/cms/types/unit";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { parseMobEvent, type MobUnitEvent } from "./mobEvents";
import { toStaffMarkers, type StaffMarker, type UnitPatch } from "./staffTypes";

export const STAFF_REFRESH_COOLDOWN_MS = 10_000;

/**
 * How long to wait after a STATUS / UNIT_SELECT event before refetching. A
 * responder toggling status a few times, or a whole shift signing on at once,
 * collapses into one request instead of one per event.
 */
const MOB_RECONCILE_DEBOUNCE_MS = 2_000;

/**
 * How often buffered TRACKING patches are applied to state.
 *
 * Every state write rebuilds the marker array, and the graphics layer answers
 * that by re-running its screen-space clustering over every marker. Coalescing
 * puts a ceiling of one such pass per second on that, whatever the fleet size or
 * the reporting cadence. The timer exists only while patches are pending, so an
 * idle map still has none from this path.
 */
const LIVE_POSITION_FLUSH_MS = 1_000;

/**
 * Safety net for roster drift.
 *
 * Assignments made in THIS app invalidate the "Dispatch" tag and refetch on
 * their own, but another dispatcher's assignment does not reach us, and TRACKING
 * deliberately no longer refetches as a side effect. A slow poll while the layer
 * is open is the cheapest way to notice a unit that joined or left the case.
 *
 * This is a considered exception to the rule that an idle map runs no timers:
 * the cost is one request a minute, and only while an operator is actually
 * looking at the staff layer.
 */
const ROSTER_SAFETY_REFETCH_MS = 60_000;

/**
 * How often markers are rebuilt so staleness is re-evaluated against the clock.
 *
 * A unit that simply stops reporting produces no event and no response, so
 * nothing would re-render and its symbol would stay confident indefinitely. See
 * the `staff` memo below.
 */
const STALE_RECHECK_MS = 30_000;

/** What a STATUS or UNIT_SELECT event states directly. The rest needs the refetch. */
type FieldPatch = Pick<UnitPatch, "sttId" | "username">;

/** A TRACKING patch, plus when the fix it carries was taken. */
interface LocationPatch {
  patch: UnitPatch;
  /** Epoch ms - how a later snapshot decides whether it has caught up. */
  atMs: number;
}

export interface UseStaffPositionsResult {
  staff: StaffMarker[];
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
  canRefresh: boolean;
}

/**
 * DEV-only sanity check on the status code a STATUS event carries.
 *
 * `sttId` is MDM-configured free text, and the map colours a marker by comparing
 * it against the ids the unit list uses (staffSymbols.ts). A code matching
 * nothing still renders - as "engaged", red - which is a wrong marker with no
 * visible cause. MOB.sh's own example sends "S001", which is not one of the unit
 * status ids this app knows, so this is a live possibility, not a theoretical
 * one. Warn rather than guess: the fix is a backend contract question.
 */
function warnOnUnknownStatusId(sttId: string): void {
  if (!import.meta.env.DEV) {
    return;
  }
  try {
    const statuses = JSON.parse(localStorage.getItem("unit_status") ?? "[]") as UnitStatus[];
    // An empty cache means the list has not been fetched yet - nothing to judge against.
    if (statuses.length > 0 && !statuses.some((status) => status.sttId === sttId)) {
      console.warn(
        `[staff] MOB STATUS event carried sttId "${sttId}", which is not in the cached ` +
          "unit_status list. The marker will be coloured as engaged. Check the backend contract."
      );
    }
  }
  catch {
    // Cache unreadable, so there is nothing to check against. This is a dev aid only.
  }
}

/** What the map can take from a STATUS / UNIT_SELECT event on its own. */
function toFieldPatch(event: MobUnitEvent): FieldPatch | null {
  if (event.eventType === "STATUS") {
    if (!event.sttId) {
      return null;
    }
    warnOnUnknownStatusId(event.sttId);
    return { sttId: event.sttId };
  }
  if (event.eventType === "UNIT_SELECT") {
    // `isLogin` is deliberately not inferred: there is no deselect event, so the
    // socket can say a unit was crewed but never that it was left.
    return event.username ? { username: event.username } : null;
  }
  return null;
}

/** Epoch ms to the ISO string `Unit.locGpsTime` is, or undefined if unusable. */
function toIsoTimestamp(epochMs: number): string | undefined {
  const time = new Date(epochMs).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

/** When the event happened: its fix time, else its server timestamp, else now. */
function toEventTimeMs(event: MobUnitEvent): number {
  const gpsTimeMs = event.location?.gpsTimeMs;
  if (gpsTimeMs !== undefined && Number.isFinite(gpsTimeMs)) {
    return gpsTimeMs;
  }
  const createdAtMs = event.createdAt ? Date.parse(event.createdAt) : Number.NaN;
  return Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
}

/**
 * Translate a TRACKING event into the `Unit` field names the rest of the app
 * uses. The two vocabularies genuinely differ - `latitude` vs `locLat`,
 * `heading` vs `locBearing` - and `gpsTime` arrives as epoch milliseconds where
 * `locGpsTime` is a string, so this is a real adaptation and not a rename.
 *
 * Keys are OMITTED rather than set to undefined: the patch is spread over a real
 * Unit, and `{ locGpsTime: undefined }` would erase a good value with nothing.
 *
 * `provider` is not carried across. The event sends "GPS" where
 * `Unit.locProvider` is a number, and the map has no use for either.
 * `altitude`, `satellites` and `breakDuration` are dropped for the same reason.
 */
function toLocationPatch(event: MobUnitEvent): LocationPatch | null {
  const location = event.location;
  if (!location) {
    return null;
  }

  const gpsTime =
    location.gpsTimeMs !== undefined ? toIsoTimestamp(location.gpsTimeMs) : undefined;

  return {
    atMs: toEventTimeMs(event),
    patch: {
      locLat: location.latitude,
      locLon: location.longitude,
      ...(location.heading !== undefined && { locBearing: location.heading }),
      ...(location.speed !== undefined && { locSpeed: location.speed }),
      ...(location.accuracy !== undefined && { locAccuracy: location.accuracy }),
      ...(gpsTime !== undefined && { locGpsTime: gpsTime }),
      // The event carries no locLastUpdateTime. `createdAt` is its honest
      // analogue - when the server last heard from this unit - which is exactly
      // what isStaleLocation reads, and it stays distinct from the fix time above.
      ...(event.createdAt !== undefined && { locLastUpdateTime: event.createdAt })
    }
  };
}

/** How current the server's own position for a unit is, in epoch ms. */
function serverFixTimeMs(unit: Unit): number {
  const gpsTime = Date.parse(unit.locGpsTime ?? "");
  if (Number.isFinite(gpsTime)) {
    return gpsTime;
  }
  const updated = Date.parse(unit.locLastUpdateTime ?? "");
  return Number.isFinite(updated) ? updated : Number.NEGATIVE_INFINITY;
}

/**
 * @param caseId  Case whose dispatch units are shown.
 * @param enabled Whether the staff layer is switched on. While false nothing is
 *                fetched and nothing is subscribed - an operator who never opens
 *                the layer should not pay for it.
 */
export function useStaffPositions(caseId: string, enabled: boolean): UseStaffPositionsResult {
  const { onMessage } = useWebSocket();

  const { data, isFetching, isError, refetch } = useGetUnitQuery(
    { caseId },
    { skip: !enabled || !caseId }
  );

  const [cooldownUntil, setCooldownUntil] = useState(0);
  // Write-only: bumping it re-renders so `canRefresh` below is re-evaluated when
  // the cooldown expires. The value itself is never read.
  const [, setCooldownTick] = useState(0);
  const [fieldPatches, setFieldPatches] = useState<Record<string, FieldPatch>>({});
  const [locationPatches, setLocationPatches] = useState<Record<string, LocationPatch>>({});
  const [staleCheckMs, setStaleCheckMs] = useState(() => Date.now());

  const units = data?.data;

  // The provider rebuilds `onMessage` on every render (and it re-renders on every
  // socket message), so depending on it directly would resubscribe constantly.
  // Same reasoning for the two below: the subscriber is registered once and must
  // still see current values.
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  // Units this map is responsible for. Deliberately the RAW list rather than the
  // rendered markers: toStaffMarkers drops units reporting 0/0, and those are
  // exactly the ones whose first real position a TRACKING event should pick up.
  const knownUnitIds = useMemo(
    () => new Set((units ?? []).map((unit) => unit.unitId)),
    [units]
  );
  const knownUnitIdsRef = useRef(knownUnitIds);
  knownUnitIdsRef.current = knownUnitIds;

  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // TRACKING patches waiting to be applied. Held in a ref, not state, precisely
  // so that arriving does not re-render - that is the whole point of the buffer.
  const pendingLocationsRef = useRef<Record<string, LocationPatch>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReconcile = useCallback(() => {
    if (reconcileTimerRef.current) {
      clearTimeout(reconcileTimerRef.current);
    }
    reconcileTimerRef.current = setTimeout(() => {
      reconcileTimerRef.current = null;
      refetchRef.current();
    }, MOB_RECONCILE_DEBOUNCE_MS);
  }, []);

  // Leading-edge-free throttle: the first patch of a burst starts the clock and
  // everything that lands inside the window rides along with it. Re-arming on
  // each patch instead would let a steadily-reporting fleet postpone the flush
  // indefinitely.
  const scheduleLocationFlush = useCallback(() => {
    if (flushTimerRef.current) {
      return;
    }
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const pending = pendingLocationsRef.current;
      pendingLocationsRef.current = {};
      if (Object.keys(pending).length === 0) {
        return;
      }
      setLocationPatches((previous) => {
        const next = { ...previous };
        Object.entries(pending).forEach(([unitId, incoming]) => {
          const existing = next[unitId];
          // Out-of-order delivery is possible on a shared socket; the older fix
          // must not overwrite the newer one just by arriving second.
          if (!existing || incoming.atMs >= existing.atMs) {
            next[unitId] = incoming;
          }
        });
        return next;
      });
    }, LIVE_POSITION_FLUSH_MS);
  }, []);

  // Re-render once when the cooldown expires so the button re-enables. Nothing
  // counts it down, so there is no reason to re-render while it runs.
  useEffect(() => {
    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs <= 0) {
      return;
    }
    const timeoutId = setTimeout(() => setCooldownTick((tick) => tick + 1), remainingMs);
    return () => clearTimeout(timeoutId);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return onMessageRef.current((message) => {
      const event = parseMobEvent(message.data);
      if (!event) {
        return;
      }
      // MOB is org-wide traffic - the socket subscribes per {orgId, username} -
      // while this map owns one case's candidates. Everyone else is not ours.
      if (!knownUnitIdsRef.current.has(event.unitId)) {
        return;
      }

      if (event.eventType === "TRACKING") {
        const locationPatch = toLocationPatch(event);
        if (!locationPatch) {
          // The unit reported, but not a position this map can use. A refetch
          // would only return the same last-known position we already hold.
          return;
        }
        const pending = pendingLocationsRef.current[event.unitId];
        if (!pending || locationPatch.atMs >= pending.atMs) {
          pendingLocationsRef.current[event.unitId] = locationPatch;
        }
        // Deliberately NO reconcile: the event already said where the unit is,
        // and at this cadence a refetch per event is pure load.
        scheduleLocationFlush();
        return;
      }

      // STATUS / UNIT_SELECT state one field each. Applied immediately - these
      // are rare enough that coalescing would only delay a recolour - and
      // followed by a refetch for everything they leave unsaid.
      const patch = toFieldPatch(event);
      if (patch) {
        setFieldPatches((previous) => ({
          ...previous,
          [event.unitId]: { ...previous[event.unitId], ...patch }
        }));
      }
      // Scheduled even when nothing was patchable: the event still says this unit
      // changed, and only the server knows the rest of how.
      scheduleReconcile();
    });
  }, [enabled, scheduleLocationFlush, scheduleReconcile]);

  // A snapshot is authoritative for status and crew, so the field patches that
  // prompted it are spent; keeping them would eventually paint an older value
  // over a newer one.
  useEffect(() => {
    setFieldPatches((previous) => (Object.keys(previous).length > 0 ? {} : previous));
  }, [units]);

  // Position patches, by contrast, are expired individually and only once the
  // server has actually caught up with them. A snapshot in flight while a unit
  // keeps reporting is OLDER than what we already have, and dropping the patch
  // on its arrival is exactly the backwards jump this guards against.
  useEffect(() => {
    setLocationPatches((previous) => {
      const unitIds = Object.keys(previous);
      if (unitIds.length === 0) {
        return previous;
      }
      const serverFixById = new Map((units ?? []).map((unit) => [unit.unitId, serverFixTimeMs(unit)]));
      const kept: Record<string, LocationPatch> = {};
      unitIds.forEach((unitId) => {
        const serverFixMs = serverFixById.get(unitId);
        if (serverFixMs === undefined || serverFixMs < previous[unitId].atMs) {
          kept[unitId] = previous[unitId];
        }
      });
      // Same keys means the same object - do not re-render for a no-op.
      return Object.keys(kept).length === unitIds.length ? previous : kept;
    });
  }, [units]);

  // Closing the layer drops the live state, so re-opening starts from a fresh
  // server snapshot rather than replaying an old socket state.
  useEffect(() => {
    if (enabled) {
      return;
    }
    setFieldPatches({});
    setLocationPatches({});
    pendingLocationsRef.current = {};
    if (reconcileTimerRef.current) {
      clearTimeout(reconcileTimerRef.current);
      reconcileTimerRef.current = null;
    }
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [enabled]);

  // Roster drift - see ROSTER_SAFETY_REFETCH_MS.
  useEffect(() => {
    if (!enabled || !caseId) {
      return;
    }
    const intervalId = setInterval(() => refetchRef.current(), ROSTER_SAFETY_REFETCH_MS);
    return () => clearInterval(intervalId);
  }, [enabled, caseId]);

  // Advances the clock the `staff` memo below is rebuilt against.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const intervalId = setInterval(() => setStaleCheckMs(Date.now()), STALE_RECHECK_MS);
    return () => clearInterval(intervalId);
  }, [enabled]);

  useEffect(
    () => () => {
      if (reconcileTimerRef.current) {
        clearTimeout(reconcileTimerRef.current);
      }
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    },
    []
  );

  // One patch per unit, position last so a fresh fix wins over a stale field
  // patch for the same unit.
  const mergedPatches = useMemo(() => {
    const fieldIds = Object.keys(fieldPatches);
    const locationIds = Object.keys(locationPatches);
    if (fieldIds.length === 0 && locationIds.length === 0) {
      return undefined;
    }
    const merged: Record<string, UnitPatch> = {};
    fieldIds.forEach((unitId) => {
      merged[unitId] = { ...fieldPatches[unitId] };
    });
    locationIds.forEach((unitId) => {
      merged[unitId] = { ...merged[unitId], ...locationPatches[unitId].patch };
    });
    return merged;
  }, [fieldPatches, locationPatches]);

  const staff = useMemo(
    () => toStaffMarkers(units, mergedPatches),
    // `staleCheckMs` is a deliberate dependency that the body does not read. It
    // rebuilds the marker array on a fixed cadence, which is what makes a unit
    // that has simply gone quiet turn stale on screen: both the layer and the
    // panel evaluate isStaleLocation against the CURRENT clock, but neither
    // re-runs until this array changes identity, and a silent unit produces no
    // event and no response to change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [units, mergedPatches, staleCheckMs]
  );

  const canRefresh = enabled && !isFetching && cooldownUntil <= Date.now();

  // Only a user press arms the cooldown. Reconcile refetches must not, or a busy
  // shift would leave the button disabled for good - and `isFetching` above is
  // what actually guards against re-issuing a request still in flight, which is
  // all the cooldown was ever protecting.
  const refresh = useCallback(() => {
    if (!canRefresh) {
      return;
    }
    setCooldownUntil(Date.now() + STAFF_REFRESH_COOLDOWN_MS);
    refetch();
  }, [canRefresh, refetch]);

  return {
    staff,
    isLoading: isFetching,
    isError,
    refresh,
    canRefresh
  };
}
