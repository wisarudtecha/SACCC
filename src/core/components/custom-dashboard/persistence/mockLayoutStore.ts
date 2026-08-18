// src/core/components/custom-dashboard/persistence/mockLayoutStore.ts
/**
 * Mock persistence for the dashboard layout API, used when VITE_MOCK_API is true.
 *
 * Backed by localStorage rather than an in-memory copy of the fixture, so a saved layout
 * survives a page reload. That is what makes customize mode genuinely testable before the
 * backend endpoint exists — an in-memory store would silently discard every save.
 *
 * Delete this file (and its branch in `useDashboardLayouts`) once the real endpoint ships.
 */
import fixture from "@/core/mocks/dashboardLayouts.json";
import type {
  DashboardLayout,
  DashboardLayoutCreateData,
  DashboardLayoutUpdateData,
} from "@/core/types/dashboardLayout";

const STORAGE_KEY = "mock:dashboardLayouts";

const seed = (): DashboardLayout[] => fixture as DashboardLayout[];

const read = (): DashboardLayout[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as DashboardLayout[];
  }
  catch (error) {
    console.error("🚀 ~ mockLayoutStore ~ Failed to read layouts, reseeding:", error);
    return seed();
  }
};

/**
 * Bumped on every write. Consumers that read the store inside a `useMemo` include this in
 * their dependencies, otherwise they would keep serving a pre-mutation copy — RTK Query's
 * cache invalidation has no equivalent here. Every write is followed by a `setState` in
 * `useDashboardLayouts`, so a re-render always follows a change.
 */
let revision = 0;

const write = (layouts: DashboardLayout[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  revision += 1;
};

export const mockLayoutStore = {
  revision: (): number => revision,

  list: (): DashboardLayout[] => read(),

  /** Mirrors the real detail endpoint, which is the only source of `widgets`. */
  get: (layoutId: string): DashboardLayout | undefined =>
    read().find(layout => layout.id === layoutId),

  create: (data: DashboardLayoutCreateData): DashboardLayout => {
    const layouts = read();
    const created: DashboardLayout = {
      ...data,
      id: `layout-${Date.now()}`,
      orgId: "mock-org",
      createdBy: "mock-user",
      lastModified: new Date().toISOString(),
    };
    write([...layouts, created]);
    return created;
  },

  update: (layoutId: string, data: DashboardLayoutUpdateData): DashboardLayout | undefined => {
    const layouts = read();
    const index = layouts.findIndex(layout => layout.id === layoutId);
    if (index === -1) {
      return undefined;
    }

    const updated: DashboardLayout = {
      ...layouts[index],
      ...data,
      lastModified: new Date().toISOString(),
    };
    layouts[index] = updated;
    write(layouts);
    return updated;
  },

  remove: (layoutId: string): void => {
    write(read().filter(layout => layout.id !== layoutId));
  },
};
