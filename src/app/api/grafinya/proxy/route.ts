import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export async function POST(request: NextRequest) {
  try {
    const { path, method = "GET", body, baseUrl, accessToken } = await request.json();

    if (!baseUrl || !path) {
      return NextResponse.json(
        { error: "baseUrl and path are required" },
        { status: 400 }
      );
    }

    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid baseUrl: must be an HTTP(S) URL" },
        { status: 400 }
      );
    }

    if (path.includes("..") || path.includes("//")) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.has(method)) {
      return NextResponse.json(
        { error: `Method ${method} is not allowed` },
        { status: 405 }
      );
    }

    const targetUrl = `${baseUrl}/api/v1${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": "ru-RU",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(targetUrl, fetchOptions);
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
    return NextResponse.json(
      { error: "Proxy request failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
