/**
 * Zustand store for Graphinya application state
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GraphinyaConfig,
  AuthTokens,
  Dashboard,
  DataSource,
  Plugin,
  Module,
  User,
  Palette,
  Widget,
} from "./grafinya-api";
import { generateId } from "./utils";

// ---- View types ----
export type AppView =
  | "dashboards"
  | "dashboard-detail"
  | "datasources"
  | "plugins"
  | "modules"
  | "settings"
  | "explorer"
  | "constructor"
  | "activity";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "demo";

export type TimeRange = "15m" | "1h" | "6h" | "24h" | "7d" | "30d";

export type Language = "ru" | "en";

// ---- Activity log entry ----
export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: string;
  category: "navigation" | "dashboard" | "datasource" | "plugin" | "module" | "auth" | "system";
  details?: string;
  targetId?: string;
  targetType?: string;
}

// ---- Recent item ----
export interface RecentItem {
  id: string;
  type: "dashboard" | "datasource";
  title: string;
  timestamp: number;
}

// ---- Store state ----
interface GraphinyaState {
  // Connection
  config: GraphinyaConfig;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  isDemoMode: boolean;

  // Auth
  tokens: AuthTokens | null;
  currentUser: User | null;

  // Navigation
  currentView: AppView;
  selectedDashboardId: string | null;
  timeRange: TimeRange;

  // Data
  dashboards: Dashboard[];
  dataSources: DataSource[];
  plugins: Plugin[];
  modules: Module[];
  palettes: Palette[];
  isLoading: boolean;

  // Activity & recent
  activityLog: ActivityEntry[];
  recentItems: RecentItem[];
  onboardingCompleted: boolean;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Actions - Connection
  setConfig: (config: GraphinyaConfig) => void;
  setConnectionStatus: (status: ConnectionStatus, error?: string | null) => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;

  // Actions - Auth
  setTokens: (tokens: AuthTokens | null) => void;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  // Actions - Navigation
  setCurrentView: (view: AppView) => void;
  setSelectedDashboardId: (id: string | null) => void;
  setTimeRange: (range: TimeRange) => void;

  // Actions - Data
  setDashboards: (dashboards: Dashboard[]) => void;
  setDataSources: (dataSources: DataSource[]) => void;
  setPlugins: (plugins: Plugin[]) => void;
  setModules: (modules: Module[]) => void;
  setPalettes: (palettes: Palette[]) => void;
  setIsLoading: (loading: boolean) => void;

  // Actions - Dashboard mutations
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  toggleDashboardFavorite: (id: string) => void;
  addWidgetToDashboard: (dashboardId: string, widget: Widget) => void;
  updateWidgetInDashboard: (
    dashboardId: string,
    widgetId: string,
    updates: Partial<Widget>
  ) => void;
  removeWidgetFromDashboard: (dashboardId: string, widgetId: string) => void;
  reorderWidgetsInDashboard: (dashboardId: string, widgetIds: string[]) => void;
  updateVariableInDashboard: (
    dashboardId: string,
    variableName: string,
    currentValue: string
  ) => void;

  // Actions - Activity & recent
  logActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearActivityLog: () => void;
  addRecentItem: (item: Omit<RecentItem, "timestamp">) => void;
  clearRecentItems: () => void;
  completeOnboarding: () => void;
}

export const useGraphinyaStore = create<GraphinyaState>()(
  persist(
    (set, get) => ({
      // Connection
      config: { baseUrl: "", frontendUrl: "" },
      connectionStatus: "disconnected",
      connectionError: null,
      isDemoMode: false,

      // Auth
      tokens: null,
      currentUser: null,

      // Navigation
      currentView: "dashboards",
      selectedDashboardId: null,
      timeRange: "1h",

      // Data
      dashboards: [],
      dataSources: [],
      plugins: [],
      modules: [],
      palettes: [],
      isLoading: false,

      // Activity & recent
      activityLog: [],
      recentItems: [],
      onboardingCompleted: false,

      // Language
      language: "ru" as Language,
      setLanguage: (lang) => set({ language: lang }),

      // Actions - Connection
      setConfig: (config) => set({ config }),
      setConnectionStatus: (status, error = null) =>
        set({ connectionStatus: status, connectionError: error }),
      enableDemoMode: () => {
        set({
          isDemoMode: true,
          connectionStatus: "demo",
          connectionError: null,
          currentUser: {
            id: "demo-user",
            username: "demo",
            email: "demo@pult.tech",
            role: "admin",
            isActive: true,
          },
        });
        // Log activity (uses get() to access latest state)
        const state = get();
        set({
          activityLog: [
            {
              id: generateId("act"),
              timestamp: Date.now(),
              action: "Включён демо-режим",
              category: "system" as const,
              details: "Пользователь активировал демонстрационный режим",
            },
            ...state.activityLog,
          ].slice(0, 200),
        });
      },
      disableDemoMode: () =>
        set({
          isDemoMode: false,
          connectionStatus: "disconnected",
          connectionError: null,
          tokens: null,
          currentUser: null,
          dashboards: [],
          dataSources: [],
          plugins: [],
          modules: [],
          palettes: [],
        }),

      // Actions - Auth
      setTokens: (tokens) => set({ tokens }),
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => {
        const state = get();
        set({
          tokens: null,
          currentUser: null,
          connectionStatus: "disconnected",
          connectionError: null,
          isDemoMode: false,
          dashboards: [],
          dataSources: [],
          plugins: [],
          modules: [],
          palettes: [],
          activityLog: [
            {
              id: generateId("act"),
              timestamp: Date.now(),
              action: "Выход из системы",
              category: "auth" as const,
              details: state.isDemoMode ? "Выход из демо-режима" : "Пользователь отключился",
            },
            ...state.activityLog,
          ].slice(0, 200),
        });
      },

      // Actions - Navigation
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedDashboardId: (id) => set({ selectedDashboardId: id }),
      setTimeRange: (range) => set({ timeRange: range }),

      // Actions - Data
      setDashboards: (dashboards) => set({ dashboards }),
      setDataSources: (dataSources) => set({ dataSources }),
      setPlugins: (plugins) => set({ plugins }),
      setModules: (modules) => set({ modules }),
      setPalettes: (palettes) => set({ palettes }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Actions - Dashboard mutations
      updateDashboard: (id, updates) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),

      toggleDashboardFavorite: (id) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === id ? { ...d, isFavorite: !d.isFavorite } : d
          ),
        })),

      addWidgetToDashboard: (dashboardId, widget) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === dashboardId
              ? {
                  ...d,
                  widgets: [...(d.widgets || []), widget],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      updateWidgetInDashboard: (dashboardId, widgetId, updates) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === dashboardId
              ? {
                  ...d,
                  widgets: (d.widgets || []).map((w) =>
                    w.id === widgetId ? { ...w, ...updates } : w
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      removeWidgetFromDashboard: (dashboardId, widgetId) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === dashboardId
              ? {
                  ...d,
                  widgets: (d.widgets || []).filter((w) => w.id !== widgetId),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      updateVariableInDashboard: (dashboardId, variableName, currentValue) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d._id === dashboardId
              ? {
                  ...d,
                  variables: (d.variables || []).map((v) =>
                    v.name === variableName ? { ...v, current: currentValue } : v
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      reorderWidgetsInDashboard: (dashboardId, widgetIds) =>
        set((state) => ({
          dashboards: state.dashboards.map((d) => {
            if (d._id !== dashboardId) return d;
            const widgetMap = new Map((d.widgets || []).map((w) => [w.id, w]));
            const reordered = widgetIds
              .map((id) => widgetMap.get(id))
              .filter((w): w is Widget => Boolean(w));
            // Append any widgets not in the new order (e.g. race conditions)
            const present = new Set(widgetIds);
            (d.widgets || []).forEach((w) => {
              if (!present.has(w.id)) reordered.push(w);
            });
            return { ...d, widgets: reordered, updatedAt: new Date().toISOString() };
          }),
        })),

      // ---- Activity & recent ----
      logActivity: (entry) =>
        set((state) => ({
          activityLog: [
            {
              ...entry,
              id: generateId("act"),
              timestamp: Date.now(),
            },
            ...state.activityLog,
          ].slice(0, 200), // cap at 200 entries
        })),

      clearActivityLog: () => set({ activityLog: [] }),

      addRecentItem: (item) =>
        set((state) => {
          const filtered = state.recentItems.filter(
            (r) => !(r.id === item.id && r.type === item.type)
          );
          return {
            recentItems: [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 10), // cap at 10 items
          };
        }),

      clearRecentItems: () => set({ recentItems: [] }),

      completeOnboarding: () => set({ onboardingCompleted: true }),
    }),
    {
      name: "graphinya-store",
      partialize: (state) => ({
        config: state.config,
        tokens: state.tokens,
        isDemoMode: state.isDemoMode,
        recentItems: state.recentItems,
        onboardingCompleted: state.onboardingCompleted,
        language: state.language,
      }),
    }
  )
);
