import { Storage } from "@/utils/storage";
import { createMockRoutes } from "./mock";
import type { RouteRecordModel } from "./types";
import { normalizeRouteRecord } from "./utils";

const ROUTE_STORAGE_KEY = "vea:route:planner_records";
const ROUTE_DRAFT_STORAGE_KEY = "vea:route:planner_drafts";

function normalizeRecords(records: RouteRecordModel[]): RouteRecordModel[] {
  return records.map((route) => normalizeRouteRecord(route));
}

function upsertById(records: RouteRecordModel[], route: RouteRecordModel): RouteRecordModel[] {
  const nextRecords = [...records];
  const index = nextRecords.findIndex((item) => item.id === route.id);

  if (index >= 0) {
    nextRecords.splice(index, 1, route);
    return nextRecords;
  }

  nextRecords.unshift(route);
  return nextRecords;
}

export function loadPersistedRouteRecords(): RouteRecordModel[] {
  const savedRoutes = Storage.get<RouteRecordModel[] | null>(ROUTE_STORAGE_KEY, null);

  if (Array.isArray(savedRoutes)) {
    const normalizedRoutes = normalizeRecords(savedRoutes).filter(
      (route) => route.persisted !== false
    );
    Storage.set(ROUTE_STORAGE_KEY, normalizedRoutes);
    return normalizedRoutes;
  }

  const defaultRoutes = createMockRoutes();
  Storage.set(ROUTE_STORAGE_KEY, defaultRoutes);
  return defaultRoutes;
}

export function getPersistedRouteRecordById(id: string): RouteRecordModel | null {
  return loadPersistedRouteRecords().find((route) => route.id === id) ?? null;
}

export function savePersistedRouteRecord(route: RouteRecordModel): RouteRecordModel[] {
  const nextRecords = upsertById(loadPersistedRouteRecords(), normalizeRouteRecord(route));
  Storage.set(ROUTE_STORAGE_KEY, nextRecords);
  return nextRecords;
}

export function deletePersistedRouteRecord(id: string): RouteRecordModel[] {
  const nextRecords = loadPersistedRouteRecords().filter((route) => route.id !== id);
  Storage.set(ROUTE_STORAGE_KEY, nextRecords);
  return nextRecords;
}

export function loadRouteDrafts(): RouteRecordModel[] {
  const savedDrafts = Storage.get<RouteRecordModel[] | null>(ROUTE_DRAFT_STORAGE_KEY, null);

  if (!Array.isArray(savedDrafts)) {
    return [];
  }

  const normalizedDrafts = normalizeRecords(savedDrafts);
  Storage.set(ROUTE_DRAFT_STORAGE_KEY, normalizedDrafts);
  return normalizedDrafts;
}

export function getRouteDraftById(id: string): RouteRecordModel | null {
  return loadRouteDrafts().find((route) => route.id === id) ?? null;
}

export function saveRouteDraft(route: RouteRecordModel): RouteRecordModel[] {
  const nextDrafts = upsertById(loadRouteDrafts(), normalizeRouteRecord(route));
  Storage.set(ROUTE_DRAFT_STORAGE_KEY, nextDrafts);
  return nextDrafts;
}

export function removeRouteDraft(id: string): RouteRecordModel[] {
  const nextDrafts = loadRouteDrafts().filter((route) => route.id !== id);
  Storage.set(ROUTE_DRAFT_STORAGE_KEY, nextDrafts);
  return nextDrafts;
}
