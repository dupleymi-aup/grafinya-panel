import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProxyRequestSchema = z.object({
  path: z
    .string()
    .min(1)
    .refine((p) => !p.includes("..") && !p.includes("//"), "Path must not contain .. or //"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  body: z.unknown().optional(),
  baseUrl: z
    .string()
    .url("baseUrl must be a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "baseUrl must be HTTP(S)"
    ),
});

function isPrivateHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const h = hostname.toLowerCase();
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "::1" ||
      h === "0.0.0.0" ||
      h.startsWith("10.") ||
      h.startsWith("192.168.") ||
      h.startsWith("172.") ||
      h.endsWith(".internal") ||
      h.endsWith(".local")
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = ProxyRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { path, method, body, baseUrl } = parsed.data;

    if (isPrivateHost(baseUrl)) {
      return NextResponse.json({ error: "Requests to private/internal hosts are forbidden" }, { status: 403 });
    }

    const targetUrl = `${baseUrl}/api/v1${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": "ru-RU",
    };

    const fetchOptions: RequestInit = { method, headers };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Upstream server returned non-JSON response" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}
