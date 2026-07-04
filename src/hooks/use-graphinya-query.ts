/**
 * Custom hook for fetching data from Graphinya API and syncing to Zustand store.
 * Eliminates the repeated useQuery + useEffect pattern across views.
 */
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";

interface UseGraphinyaQueryOptions<T> {
  /** React Query cache key */
  queryKey: string;
  /** API endpoint path */
  apiPath: string;
  /** Zustand setter to sync data */
  setter: (data: T[]) => void;
  /** Demo data to return in demo mode */
  demoData: T[];
  /** Whether the query should be enabled */
  enabled?: boolean;
}

/**
 * Fetches data from Graphinya API via proxy, with demo mode support,
 * and syncs the result to a Zustand store setter.
 *
 * @example
 * ```tsx
 * const { isLoading } = useGraphinyaQuery({
 *   queryKey: "dashboards",
 *   apiPath: "/dashboards",
 *   setter: setDashboards,
 *   demoData: DEMO_DASHBOARDS,
 * });
 * ```
 */
export function useGraphinyaQuery<T>({
  queryKey,
  apiPath,
  setter,
  demoData,
  enabled = true,
}: UseGraphinyaQueryOptions<T>) {
  const { connectionStatus } = useGraphinyaStore();
  const { call } = useGraphinyaApi();

  const isConnected =
    connectionStatus === "connected" || connectionStatus === "demo";

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, connectionStatus],
    queryFn: async () => {
      if (connectionStatus === "demo") return demoData;
      if (connectionStatus !== "connected") return [];
      const result = await call<T[]>({ path: apiPath });
      return Array.isArray(result) ? result : [];
    },
    enabled: isConnected && enabled,
  });

  useEffect(() => {
    if (data) {
      setter(data);
    }
  }, [data, setter]);

  return { isLoading, data };
}
