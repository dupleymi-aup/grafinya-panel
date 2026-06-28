import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphinyaClient, GraphinyaAPIError, resetGraphinyaClient, getGraphinyaClient } from "@/lib/grafinya-api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  resetGraphinyaClient();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers({ "content-type": "application/json" }),
  });
}

function errorResponse(status: number, body: Record<string, unknown> = { error: "fail" }) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers({ "content-type": "application/json" }),
  });
}

describe("GraphinyaClient", () => {
  let client: GraphinyaClient;

  beforeEach(() => {
    client = new GraphinyaClient({ baseUrl: "http://localhost:8000", frontendUrl: "http://localhost:3000" });
  });

  describe("config", () => {
    it("returns config", () => {
      expect(client.getConfig().baseUrl).toBe("http://localhost:8000");
    });

    it("updates config", () => {
      client.setConfig({ baseUrl: "http://new:8000", frontendUrl: "" });
      expect(client.getConfig().baseUrl).toBe("http://new:8000");
    });
  });

  describe("auth", () => {
    it("manages tokens", () => {
      expect(client.isAuthenticated()).toBe(false);
      expect(client.getTokens()).toBeNull();

      client.setTokens({ accessToken: "at", refreshToken: "rt" });
      expect(client.isAuthenticated()).toBe(true);
      expect(client.getTokens()?.accessToken).toBe("at");

      client.clearTokens();
      expect(client.isAuthenticated()).toBe(false);
    });

    it("login sets tokens", async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ accessToken: "new-at", refreshToken: "new-rt" }));
      const tokens = await client.login("admin", "pass");
      expect(tokens.accessToken).toBe("new-at");
      expect(client.isAuthenticated()).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/auth/login",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("logout clears tokens", async () => {
      client.setTokens({ accessToken: "at", refreshToken: "rt" });
      mockFetch.mockReturnValueOnce(jsonResponse({}));
      await client.logout();
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe("dashboards API", () => {
    beforeEach(() => {
      client.setTokens({ accessToken: "at", refreshToken: "rt" });
    });

    it("getDashboards", async () => {
      const dashboards = [{ _id: "1", title: "D1", createdAt: "", updatedAt: "" }];
      mockFetch.mockReturnValueOnce(jsonResponse(dashboards));
      const result = await client.getDashboards();
      expect(result).toEqual(dashboards);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/dashboards",
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer at" }) })
      );
    });

    it("createDashboard", async () => {
      const created = { _id: "new", title: "New", createdAt: "", updatedAt: "" };
      mockFetch.mockReturnValueOnce(jsonResponse(created, 201));
      const result = await client.createDashboard({ title: "New" });
      expect(result._id).toBe("new");
    });

    it("deleteDashboard", async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({}));
      await client.deleteDashboard("1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/dashboards/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("error handling", () => {
    it("throws GraphinyaAPIError on failure", async () => {
      client.setTokens({ accessToken: "at", refreshToken: "rt" });
      mockFetch.mockReturnValueOnce(errorResponse(404, { code: "NOT_FOUND", message: "Not found" }));

      await expect(client.getDashboard("missing")).rejects.toThrow(GraphinyaAPIError);
    });

    it("includes status and code in error", async () => {
      client.setTokens({ accessToken: "at", refreshToken: "rt" });
      mockFetch.mockReturnValueOnce(errorResponse(403, { code: "FORBIDDEN", message: "No access" }));

      try {
        await client.getDashboard("1");
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphinyaAPIError);
        expect((e as GraphinyaAPIError).status).toBe(403);
        expect((e as GraphinyaAPIError).code).toBe("FORBIDDEN");
      }
    });
  });

  describe("healthCheck", () => {
    it("returns health status", async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ status: "ok", uptime: 100 }));
      const result = await client.healthCheck();
      expect(result.status).toBe("ok");
    });
  });
});

describe("getGraphinyaClient singleton", () => {
  it("creates client with config", () => {
    const c = getGraphinyaClient({ baseUrl: "http://test:8000", frontendUrl: "" });
    expect(c.getConfig().baseUrl).toBe("http://test:8000");
  });

  it("returns same instance", () => {
    resetGraphinyaClient();
    const c1 = getGraphinyaClient({ baseUrl: "http://a:8000", frontendUrl: "" });
    const c2 = getGraphinyaClient();
    expect(c1).toBe(c2);
  });
});
