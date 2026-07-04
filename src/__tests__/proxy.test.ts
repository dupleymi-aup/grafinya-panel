import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/grafinya/proxy/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/grafinya/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Proxy API - Zod validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects missing baseUrl", async () => {
    const req = makeRequest({ path: "/dashboards" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("rejects missing path", async () => {
    const req = makeRequest({ baseUrl: "http://example.com:8000" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("rejects invalid baseUrl protocol", async () => {
    const req = makeRequest({ baseUrl: "ftp://evil.com", path: "/test" });
    const res = await POST(req);
    await res.json();
    expect(res.status).toBe(400);
  });

  it("rejects path traversal", async () => {
    const req = makeRequest({ baseUrl: "http://example.com:8000", path: "/../etc/passwd" });
    const res = await POST(req);
    await res.json();
    expect(res.status).toBe(400);
  });

  it("rejects invalid method", async () => {
    const req = makeRequest({
      baseUrl: "http://example.com:8000",
      path: "/test",
      method: "TRACE",
    });
    const res = await POST(req);
    await res.json();
    expect(res.status).toBe(400);
  });

  it("defaults method to GET", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest({ baseUrl: "http://example.com:8000", path: "/dashboards" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      "http://example.com:8000/api/v1/dashboards",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("proxies valid request successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ _id: "1", title: "Test" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest({
      baseUrl: "http://example.com:8000",
      path: "/dashboards",
      method: "GET",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual([{ _id: "1", title: "Test" }]);
  });

  it("returns 502 for non-JSON upstream response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("not json", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );

    const req = makeRequest({ baseUrl: "http://example.com:8000", path: "/test" });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("rejects requests to localhost (SSRF protection)", async () => {
    const req = makeRequest({ baseUrl: "http://localhost:8000", path: "/test" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toContain("private/internal hosts");
  });

  it("rejects requests to 127.0.0.1", async () => {
    const req = makeRequest({ baseUrl: "http://127.0.0.1:8000", path: "/test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects requests to 10.x.x.x private range", async () => {
    const req = makeRequest({ baseUrl: "http://10.0.0.1:8000", path: "/test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects requests to 192.168.x.x private range", async () => {
    const req = makeRequest({ baseUrl: "http://192.168.1.1:8000", path: "/test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects requests to .internal domains", async () => {
    const req = makeRequest({ baseUrl: "http://db.internal:8000", path: "/test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
