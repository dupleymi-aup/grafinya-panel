/**
 * Custom hook for making authenticated API calls to Graphinya through the Next.js proxy.
 * Handles token management and error handling.
 */
"use client";

import { useCallback } from "react";
import { useGraphinyaStore } from "@/lib/store";

interface ProxyRequestOptions {
  path: string;
  method?: string;
  body?: unknown;
}

export function useGraphinyaApi() {
  const config = useGraphinyaStore((s) => s.config);

  const call = useCallback(
    async <T = unknown>(options: ProxyRequestOptions): Promise<T> => {
      if (!config.baseUrl) {
        throw new Error("Графиня не подключена. Укажите адрес сервера.");
      }

      const response = await fetch("/api/grafinya/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: options.path,
          method: options.method || "GET",
          body: options.body,
          baseUrl: config.baseUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || `Ошибка API: ${response.status}`);
      }

      return response.json();
    },
    [config.baseUrl]
  );

  return { call };
}
