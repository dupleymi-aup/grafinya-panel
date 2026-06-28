import { describe, it, expect, beforeEach } from "vitest";
import { useGraphinyaStore } from "@/lib/store";

beforeEach(() => {
  useGraphinyaStore.setState({
    config: { baseUrl: "", frontendUrl: "" },
    connectionStatus: "disconnected",
    connectionError: null,
    isDemoMode: false,
    tokens: null,
    currentUser: null,
    currentView: "dashboards",
    selectedDashboardId: null,
    timeRange: "1h",
    dashboards: [],
    dataSources: [],
    plugins: [],
    modules: [],
    palettes: [],
    isLoading: false,
    activityLog: [],
    recentItems: [],
    onboardingCompleted: false,
  });
});

describe("Graphinya Store", () => {
  describe("Connection", () => {
    it("sets config", () => {
      useGraphinyaStore.getState().setConfig({ baseUrl: "http://localhost:8000", frontendUrl: "http://localhost:3000" });
      expect(useGraphinyaStore.getState().config.baseUrl).toBe("http://localhost:8000");
    });

    it("sets connection status", () => {
      useGraphinyaStore.getState().setConnectionStatus("connected");
      expect(useGraphinyaStore.getState().connectionStatus).toBe("connected");
    });

    it("sets connection error", () => {
      useGraphinyaStore.getState().setConnectionStatus("error", "Connection refused");
      expect(useGraphinyaStore.getState().connectionStatus).toBe("error");
      expect(useGraphinyaStore.getState().connectionError).toBe("Connection refused");
    });

    it("enables demo mode", () => {
      useGraphinyaStore.getState().enableDemoMode();
      const state = useGraphinyaStore.getState();
      expect(state.isDemoMode).toBe(true);
      expect(state.connectionStatus).toBe("demo");
      expect(state.currentUser?.username).toBe("demo");
    });

    it("disables demo mode", () => {
      useGraphinyaStore.getState().enableDemoMode();
      useGraphinyaStore.getState().disableDemoMode();
      const state = useGraphinyaStore.getState();
      expect(state.isDemoMode).toBe(false);
      expect(state.connectionStatus).toBe("disconnected");
      expect(state.dashboards).toEqual([]);
    });
  });

  describe("Auth", () => {
    it("sets tokens", () => {
      useGraphinyaStore.getState().setTokens({ accessToken: "at1", refreshToken: "rt1" });
      expect(useGraphinyaStore.getState().tokens?.accessToken).toBe("at1");
    });

    it("sets current user", () => {
      useGraphinyaStore.getState().setCurrentUser({ id: "1", username: "admin", email: "a@b.com", role: "admin", isActive: true });
      expect(useGraphinyaStore.getState().currentUser?.username).toBe("admin");
    });

    it("logout clears auth and data", () => {
      useGraphinyaStore.getState().setTokens({ accessToken: "at1", refreshToken: "rt1" });
      useGraphinyaStore.getState().setDashboards([{ _id: "1", title: "Test", createdAt: "", updatedAt: "" }]);
      useGraphinyaStore.getState().logout();
      const state = useGraphinyaStore.getState();
      expect(state.tokens).toBeNull();
      expect(state.currentUser).toBeNull();
      expect(state.dashboards).toEqual([]);
      expect(state.activityLog.length).toBe(1);
      expect(state.activityLog[0].category).toBe("auth");
    });
  });

  describe("Navigation", () => {
    it("sets current view", () => {
      useGraphinyaStore.getState().setCurrentView("settings");
      expect(useGraphinyaStore.getState().currentView).toBe("settings");
    });

    it("sets selected dashboard id", () => {
      useGraphinyaStore.getState().setSelectedDashboardId("dash-1");
      expect(useGraphinyaStore.getState().selectedDashboardId).toBe("dash-1");
    });

    it("sets time range", () => {
      useGraphinyaStore.getState().setTimeRange("24h");
      expect(useGraphinyaStore.getState().timeRange).toBe("24h");
    });
  });

  describe("Data", () => {
    it("sets dashboards", () => {
      const dashboards = [
        { _id: "1", title: "D1", createdAt: "", updatedAt: "" },
        { _id: "2", title: "D2", createdAt: "", updatedAt: "" },
      ];
      useGraphinyaStore.getState().setDashboards(dashboards);
      expect(useGraphinyaStore.getState().dashboards).toHaveLength(2);
    });

    it("sets data sources", () => {
      useGraphinyaStore.getState().setDataSources([{ _id: "ds1", name: "PG", pluginId: "postgres", fields: [], createdAt: "", updatedAt: "" }]);
      expect(useGraphinyaStore.getState().dataSources).toHaveLength(1);
    });

    it("sets loading", () => {
      useGraphinyaStore.getState().setIsLoading(true);
      expect(useGraphinyaStore.getState().isLoading).toBe(true);
    });
  });

  describe("Dashboard mutations", () => {
    beforeEach(() => {
      useGraphinyaStore.getState().setDashboards([
        { _id: "d1", title: "Dash1", widgets: [], isFavorite: false, createdAt: "", updatedAt: "" },
      ]);
    });

    it("updates dashboard", () => {
      useGraphinyaStore.getState().updateDashboard("d1", { title: "Updated" });
      expect(useGraphinyaStore.getState().dashboards[0].title).toBe("Updated");
    });

    it("toggles favorite", () => {
      useGraphinyaStore.getState().toggleDashboardFavorite("d1");
      expect(useGraphinyaStore.getState().dashboards[0].isFavorite).toBe(true);
      useGraphinyaStore.getState().toggleDashboardFavorite("d1");
      expect(useGraphinyaStore.getState().dashboards[0].isFavorite).toBe(false);
    });

    it("adds widget to dashboard", () => {
      const widget = { id: "w1", title: "Widget1", type: "graph" };
      useGraphinyaStore.getState().addWidgetToDashboard("d1", widget);
      expect(useGraphinyaStore.getState().dashboards[0].widgets).toHaveLength(1);
      expect(useGraphinyaStore.getState().dashboards[0].widgets![0].id).toBe("w1");
    });

    it("removes widget from dashboard", () => {
      useGraphinyaStore.getState().addWidgetToDashboard("d1", { id: "w1", title: "W1", type: "graph" });
      useGraphinyaStore.getState().removeWidgetFromDashboard("d1", "w1");
      expect(useGraphinyaStore.getState().dashboards[0].widgets).toHaveLength(0);
    });

    it("reorders widgets", () => {
      useGraphinyaStore.getState().addWidgetToDashboard("d1", { id: "w1", title: "W1", type: "graph" });
      useGraphinyaStore.getState().addWidgetToDashboard("d1", { id: "w2", title: "W2", type: "table" });
      useGraphinyaStore.getState().reorderWidgetsInDashboard("d1", ["w2", "w1"]);
      const widgets = useGraphinyaStore.getState().dashboards[0].widgets!;
      expect(widgets[0].id).toBe("w2");
      expect(widgets[1].id).toBe("w1");
    });
  });

  describe("Activity & Recent", () => {
    it("logs activity", () => {
      useGraphinyaStore.getState().logActivity({ action: "Test action", category: "system" });
      expect(useGraphinyaStore.getState().activityLog).toHaveLength(1);
      expect(useGraphinyaStore.getState().activityLog[0].action).toBe("Test action");
    });

    it("clears activity log", () => {
      useGraphinyaStore.getState().logActivity({ action: "Test", category: "system" });
      useGraphinyaStore.getState().clearActivityLog();
      expect(useGraphinyaStore.getState().activityLog).toHaveLength(0);
    });

    it("caps activity log at 200", () => {
      for (let i = 0; i < 250; i++) {
        useGraphinyaStore.getState().logActivity({ action: `Action ${i}`, category: "system" });
      }
      expect(useGraphinyaStore.getState().activityLog.length).toBeLessThanOrEqual(200);
    });

    it("adds recent item", () => {
      useGraphinyaStore.getState().addRecentItem({ id: "d1", type: "dashboard", title: "Dash" });
      expect(useGraphinyaStore.getState().recentItems).toHaveLength(1);
    });

    it("deduplicates recent items", () => {
      useGraphinyaStore.getState().addRecentItem({ id: "d1", type: "dashboard", title: "Dash1" });
      useGraphinyaStore.getState().addRecentItem({ id: "d1", type: "dashboard", title: "Dash1 Updated" });
      expect(useGraphinyaStore.getState().recentItems).toHaveLength(1);
      expect(useGraphinyaStore.getState().recentItems[0].title).toBe("Dash1 Updated");
    });

    it("caps recent items at 10", () => {
      for (let i = 0; i < 15; i++) {
        useGraphinyaStore.getState().addRecentItem({ id: `d${i}`, type: "dashboard", title: `Dash${i}` });
      }
      expect(useGraphinyaStore.getState().recentItems.length).toBeLessThanOrEqual(10);
    });

    it("completes onboarding", () => {
      expect(useGraphinyaStore.getState().onboardingCompleted).toBe(false);
      useGraphinyaStore.getState().completeOnboarding();
      expect(useGraphinyaStore.getState().onboardingCompleted).toBe(true);
    });
  });
});
