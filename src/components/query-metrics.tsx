"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Clock,
  Database,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Hash,
  Zap,
} from "lucide-react";

export interface QueryMetrics {
  /** Wall-clock time the query took, in milliseconds */
  durationMs: number;
  /** Number of rows returned (or 0 for non-tabular responses) */
  rowCount: number;
  /** Number of columns/series returned */
  columnCount: number;
  /** Size of the raw response payload, in bytes */
  bytes: number;
  /** Timestamp when the query finished */
  finishedAt: number;
  /** Was the query served from cache? */
  cached: boolean;
  /** Optional error message if the query failed */
  error?: string;
}

interface QueryMetricsBarProps {
  metrics: QueryMetrics | null;
  isRunning: boolean;
  className?: string;
  /** Compact variant hides labels and shows only icons + values */
  compact?: boolean;
}

/**
 * Compact performance metrics display for queries.
 *
 * Shows: duration, row count, response size, and cache hit indicator.
 * Provides tooltip explanations for each metric. Color-codes the
 * duration based on thresholds so users can spot slow queries at a glance.
 */
export function QueryMetricsBar({
  metrics,
  isRunning,
  className = "",
  compact = false,
}: QueryMetricsBarProps) {
  if (isRunning) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Activity className="mr-1 h-3 w-3 animate-pulse text-amber-500" />
        {compact ? "…" : "Выполняется…"}
      </Badge>
    );
  }

  if (!metrics) {
    return null;
  }

  if (metrics.error) {
    return (
      <Badge variant="outline" className="border-red-500/30 text-xs text-red-600">
        <AlertTriangle className="mr-1 h-3 w-3" />
        {compact ? "Ошибка" : "Ошибка запроса"}
      </Badge>
    );
  }

  const { durationMs, rowCount, columnCount, bytes, cached } = metrics;
  const duration = formatDuration(durationMs);
  const size = formatBytes(bytes);
  const durationTone = getDurationTone(durationMs);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`cursor-help text-xs ${durationTone}`}>
              <Clock className="mr-1 h-3 w-3" />
              {duration}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-0.5">
              <div className="font-medium">Время выполнения</div>
              <div className="text-muted-foreground">{durationMs.toLocaleString("ru-RU")} мс</div>
              <div className="text-muted-foreground">{cached ? "Из кэша" : "Прямой запрос"}</div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-help text-xs">
              <Hash className="mr-1 h-3 w-3" />
              {rowCount.toLocaleString("ru-RU")}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-0.5">
              <div className="font-medium">Количество строк</div>
              <div className="text-muted-foreground">
                {columnCount > 0 && `${columnCount} колонок, `}
                {rowCount.toLocaleString("ru-RU")} строк
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-help text-xs">
              <Database className="mr-1 h-3 w-3" />
              {size}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-0.5">
              <div className="font-medium">Размер ответа</div>
              <div className="text-muted-foreground">{bytes.toLocaleString("ru-RU")} байт</div>
            </div>
          </TooltipContent>
        </Tooltip>

        {cached && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-help border-emerald-500/30 text-xs text-emerald-600"
              >
                <Zap className="mr-1 h-3 w-3" />
                {compact ? "Кэш" : "Из кэша"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="font-medium">Кэш-попадание</div>
              <div className="text-muted-foreground">Запрос выполнен из кэша Tarantool</div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Hook that tracks query performance metrics for a single async operation.
 *
 * Usage:
 *   const { metrics, isRunning, runWithMetrics } = useQueryMetrics();
 *   const result = await runWithMetrics(() => fetch(...));
 *
 * The hook automatically measures duration, byte size, and row count
 * based on the returned value.
 */
export function useQueryMetrics() {
  const [metrics, setMetrics] = useState<QueryMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const startRef = useRef<number>(0);

  const runWithMetrics = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsRunning(true);
    startRef.current = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - startRef.current);

      // Try to derive metrics from common response shapes
      const { rowCount, columnCount, bytes, cached } = analyzeResult(result);

      setMetrics({
        durationMs,
        rowCount,
        columnCount,
        bytes,
        cached,
        finishedAt: Date.now(),
      });
      return result;
    } catch (e) {
      const durationMs = Math.round(performance.now() - startRef.current);
      setMetrics({
        durationMs,
        rowCount: 0,
        columnCount: 0,
        bytes: 0,
        cached: false,
        finishedAt: Date.now(),
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setMetrics(null);
    setIsRunning(false);
  };

  return { metrics, isRunning, runWithMetrics, reset };
}

// ---- Helpers ----

function formatDuration(ms: number): string {
  if (ms < 1) return "<1 мс";
  if (ms < 1000) return `${Math.round(ms)} мс`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(2)} с`;
  const min = Math.floor(sec / 60);
  const remSec = Math.round(sec % 60);
  return `${min} мин ${remSec} с`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Б";
  if (bytes < 1024) return `${bytes} Б`;
  const units = ["КБ", "МБ", "ГБ"];
  let val = bytes / 1024;
  let unitIdx = 0;
  while (val >= 1024 && unitIdx < units.length - 1) {
    val /= 1024;
    unitIdx++;
  }
  return `${val.toFixed(1)} ${units[unitIdx]}`;
}

function getDurationTone(ms: number): string {
  if (ms < 200) return "border-emerald-500/30 text-emerald-600";
  if (ms < 1000) return "border-amber-500/30 text-amber-600";
  if (ms < 5000) return "border-orange-500/30 text-orange-600";
  return "border-red-500/30 text-red-600";
}

function analyzeResult(result: unknown): {
  rowCount: number;
  columnCount: number;
  bytes: number;
  cached: boolean;
} {
  // Try to compute byte size from a JSON-serializable result
  let bytes = 0;
  try {
    bytes = new Blob([JSON.stringify(result)]).size;
  } catch {
    bytes = 0;
  }

  // Detect cache flag from common API wrappers
  const cached =
    (typeof result === "object" &&
      result !== null &&
      "cached" in result &&
      Boolean((result as { cached: unknown }).cached)) ||
    false;

  // Detect row/column counts
  let rows: unknown[] | null = null;
  if (Array.isArray(result)) {
    rows = result;
  } else if (typeof result === "object" && result !== null) {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.data)) rows = r.data as unknown[];
    else if (Array.isArray(r.rows)) rows = r.rows as unknown[];
    else if (Array.isArray(r.result)) rows = r.result as unknown[];
  }

  if (!rows || rows.length === 0) {
    return { rowCount: 0, columnCount: 0, bytes, cached };
  }

  const firstRow = rows[0];
  const columnCount =
    typeof firstRow === "object" && firstRow !== null ? Object.keys(firstRow as object).length : 1;

  return { rowCount: rows.length, columnCount, bytes, cached };
}

/**
 * Compare two metric snapshots and produce a delta indicator.
 * Useful for showing whether a re-query got faster or slower.
 */
export function MetricsDelta({
  current,
  previous,
}: {
  current: QueryMetrics | null;
  previous: QueryMetrics | null;
}) {
  if (!current || !previous) return null;
  const delta = current.durationMs - previous.durationMs;
  if (Math.abs(delta) < 5) return null;

  const pct = Math.round((delta / previous.durationMs) * 100);
  const isSlower = delta > 0;

  return (
    <Badge
      variant="outline"
      className={`text-xs ${
        isSlower ? "border-red-500/30 text-red-600" : "border-emerald-500/30 text-emerald-600"
      }`}
    >
      {isSlower ? (
        <TrendingUp className="mr-1 h-3 w-3" />
      ) : (
        <TrendingDown className="mr-1 h-3 w-3" />
      )}
      {isSlower ? "+" : "−"}
      {Math.abs(pct)}%
    </Badge>
  );
}
