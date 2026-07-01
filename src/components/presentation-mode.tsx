"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import type { Widget } from "@/lib/grafinya-api";
import { generateTimeSeriesData, generatePieData, generateTableData } from "@/lib/demo-data";
import { getPaletteById } from "@/lib/chart-palettes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Clock,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  BarChart3,
  Table2,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from "recharts";

interface PresentationModeProps {
  /** Initial dashboard id to present */
  dashboardId: string;
  /** Called when the user exits presentation mode */
  onExit: () => void;
}

const ROTATION_INTERVALS = [
  { value: 0, label: "Без авто-смены" },
  { value: 10, label: "10 сек" },
  { value: 20, label: "20 сек" },
  { value: 30, label: "30 сек" },
  { value: 60, label: "1 мин" },
  { value: 120, label: "2 мин" },
];

const REFRESH_INTERVALS = [
  { value: 0, label: "Без авто-обновления" },
  { value: 10, label: "10 сек" },
  { value: 30, label: "30 сек" },
  { value: 60, label: "1 мин" },
  { value: 300, label: "5 мин" },
];

/**
 * Fullscreen presentation mode for dashboards.
 *
 * Renders a single dashboard widget at a time in a clean, chrome-free
 * layout. Designed for wall-mounted displays in NOC/SOC rooms. Supports
 * auto-rotation between dashboards, auto-refresh of underlying data,
 * and keyboard navigation.
 */
export function PresentationMode({ dashboardId, onExit }: PresentationModeProps) {
  const { dashboards, timeRange, isDemoMode } = useGraphinyaStore();
  const { call: performQuery } = useGraphinyaApi();

  const [activeDashboardId, setActiveDashboardId] = useState(dashboardId);
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [rotationSec, setRotationSec] = useState(0);
  const [refreshSec, setRefreshSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Hide cursor and controls after 5 seconds of inactivity
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  const activeDashboard = useMemo(
    () => dashboards.find((d) => d._id === activeDashboardId) ?? null,
    [dashboards, activeDashboardId]
  );

  const activeWidgets = (activeDashboard?.widgets ?? []) as Widget[];
  const activeWidget = activeWidgets[activeWidgetIndex] ?? null;
  const palette = getPaletteById("amber");

  // ---- Request browser fullscreen on mount ----
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {
          /* user may have denied fullscreen; component still works in window */
        });
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ---- Listen for fullscreen changes (Esc exits fullscreen natively) ----
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        // User pressed Esc — exit presentation mode entirely
        onExit();
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [onExit]);

  const nextWidget = useCallback(() => {
    if (activeWidgets.length <= 1) return;
    setActiveWidgetIndex((i) => (i + 1) % activeWidgets.length);
  }, [activeWidgets.length]);

  const prevWidget = useCallback(() => {
    if (activeWidgets.length <= 1) return;
    setActiveWidgetIndex((i) => (i - 1 + activeWidgets.length) % activeWidgets.length);
  }, [activeWidgets.length]);

  const nextDashboard = useCallback(() => {
    if (dashboards.length <= 1) return;
    const idx = dashboards.findIndex((d) => d._id === activeDashboardId);
    const next = dashboards[(idx + 1) % dashboards.length];
    setActiveDashboardId(next._id);
    setActiveWidgetIndex(0);
  }, [dashboards, activeDashboardId]);

  const prevDashboard = useCallback(() => {
    if (dashboards.length <= 1) return;
    const idx = dashboards.findIndex((d) => d._id === activeDashboardId);
    const prev = dashboards[(idx - 1 + dashboards.length) % dashboards.length];
    setActiveDashboardId(prev._id);
    setActiveWidgetIndex(0);
  }, [dashboards, activeDashboardId]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    } else {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    }
  }, []);

  // ---- Keyboard navigation ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          nextWidget();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevWidget();
          break;
        case "ArrowUp":
          e.preventDefault();
          prevDashboard();
          break;
        case "ArrowDown":
          e.preventDefault();
          nextDashboard();
          break;
        case "p":
        case "P":
          setIsPaused((p) => !p);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          onExit();
          break;
        case "h":
        case "H":
          setShowControls((s) => !s);
          break;
      }
      setLastActivity(Date.now());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextWidget, prevWidget, nextDashboard, prevDashboard, toggleFullscreen, onExit]);

  // ---- Auto-hide controls after inactivity ----
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 4000) {
        setShowControls(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  // ---- Track mouse movement to show controls ----
  useEffect(() => {
    const onMove = () => {
      setShowControls(true);
      setLastActivity(Date.now());
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onMove);
    };
  }, []);

  // ---- Auto-rotate between widgets/dashboards ----
  useEffect(() => {
    if (!rotationSec || isPaused) return;
    const id = setInterval(() => {
      if (activeWidgets.length > 1) {
        setActiveWidgetIndex((i) => (i + 1) % activeWidgets.length);
      } else if (dashboards.length > 1) {
        const idx = dashboards.findIndex((d) => d._id === activeDashboardId);
        const next = dashboards[(idx + 1) % dashboards.length];
        setActiveDashboardId(next._id);
        setActiveWidgetIndex(0);
      }
    }, rotationSec * 1000);
    return () => clearInterval(id);
  }, [rotationSec, isPaused, activeWidgets.length, dashboards, activeDashboardId]);

  // ---- Auto-refresh data ----
  useEffect(() => {
    if (!refreshSec) return;
    const id = setInterval(() => setRefreshCounter((c) => c + 1), refreshSec * 1000);
    return () => clearInterval(id);
  }, [refreshSec]);

  if (!activeDashboard) {
    return (
      <div className="bg-background fixed inset-0 z-[100] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground">Дашборд не найден</p>
          <Button onClick={onExit}>Выйти</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-background fixed inset-0 z-[100] flex flex-col ${
        showControls ? "cursor-default" : "cursor-none"
      }`}
    >
      {/* Subtle top gradient for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/10 to-transparent dark:from-white/5" />

      {/* Header (auto-hides) */}
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl leading-tight font-bold">{activeDashboard.title}</h1>
              {activeDashboard.description && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {activeDashboard.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaused && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                <Pause className="mr-1 h-3 w-3" /> Пауза
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {timeRange}
            </Badge>
            {isDemoMode && <Badge className="bg-violet-500/10 text-xs text-violet-600">Демо</Badge>}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex-1 overflow-hidden px-8 pb-8">
        {activeWidget ? (
          <PresentationWidget
            key={`${activeDashboard._id}-${activeWidget.id}-${refreshCounter}`}
            widget={activeWidget}
            palette={palette}
            isDemo={isDemoMode}
            timeRange={timeRange}
            performQuery={performQuery}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <Table2 className="text-muted-foreground/50 mx-auto h-12 w-12" />
              <p className="text-muted-foreground">В дашборде нет виджетов</p>
            </div>
          </div>
        )}

        {/* Widget pager indicator */}
        {activeWidgets.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {activeWidgets.map((w, i) => (
              <button
                key={w.id}
                onClick={() => setActiveWidgetIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeWidgetIndex
                    ? "w-8 bg-amber-500"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5"
                }`}
                aria-label={`Виджет ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom control bar (auto-hides) */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-8 py-4">
          {/* Left: navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevDashboard}
              disabled={dashboards.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground min-w-[80px] text-center text-xs">
              Дашборд {dashboards.findIndex((d) => d._id === activeDashboardId) + 1} /{" "}
              {dashboards.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={nextDashboard}
              disabled={dashboards.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="bg-border mx-2 h-6 w-px" />

            <Button
              variant="outline"
              size="icon"
              onClick={prevWidget}
              disabled={activeWidgets.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground min-w-[80px] text-center text-xs">
              Виджет {Math.min(activeWidgetIndex + 1, activeWidgets.length)} /{" "}
              {activeWidgets.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={nextWidget}
              disabled={activeWidgets.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: rotation / refresh controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Activity className="h-3 w-3" /> Смена:
              </span>
              <Select value={String(rotationSec)} onValueChange={(v) => setRotationSec(Number(v))}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROTATION_INTERVALS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <RefreshCw className="h-3 w-3" /> Обновление:
              </span>
              <Select value={String(refreshSec)} onValueChange={(v) => setRefreshSec(Number(v))}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_INTERVALS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: pause, fullscreen, exit */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPaused((p) => !p)}
              title={isPaused ? "Продолжить (P)" : "Пауза (P)"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Выйти из полноэкранного режима (F)" : "Полный экран (F)"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="destructive" size="sm" onClick={onExit}>
              <X className="mr-1 h-4 w-4" /> Выход
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Widget renderer for presentation mode ----
interface PresentationWidgetProps {
  widget: Widget;
  palette: ReturnType<typeof getPaletteById>;
  isDemo: boolean;
  timeRange: string;
  performQuery: ReturnType<typeof useGraphinyaApi>["call"];
}

function PresentationWidget({
  widget,
  palette,
  isDemo,
  timeRange,
  performQuery,
}: PresentationWidgetProps) {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      // In demo mode, fall back to generated data
      if (isDemo || !widget.query) {
        const generated = generateDemoData(widget);
        if (!cancelled) {
          setData(generated);
          setLoading(false);
        }
        return;
      }

      try {
        // Proxy through the Next.js API route
        const result = await performQuery({
          path: "/query",
          method: "POST",
          body: {
            dataSourceId: widget.dataSourceId,
            queries: [
              {
                refID: "A",
                maxDataPoints: 100,
                timeRange: { from: Date.now() / 1000 - 3600, to: Date.now() / 1000 },
                json: widget.query,
              },
            ],
          },
        });
        if (!cancelled) {
          const rows = Array.isArray(result)
            ? result
            : ((result as { data?: unknown[] })?.data ?? []);
          setData(rows as unknown[]);
        }
      } catch {
        if (!cancelled) {
          setData(generateDemoData(widget));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [widget, timeRange, isDemo, performQuery]);

  const widgetTitle = widget.title || "Без названия";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
          <p className="text-muted-foreground text-sm">Загрузка данных…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        {widget.type === "line" && <TrendingUp className="h-5 w-5 text-amber-500" />}
        {widget.type === "bar" && <BarChart3 className="h-5 w-5 text-amber-500" />}
        {widget.type === "pie" && <Activity className="h-5 w-5 text-amber-500" />}
        {widget.type === "table" && <Table2 className="h-5 w-5 text-amber-500" />}
        <h2 className="text-xl font-semibold">{widgetTitle}</h2>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartByType(widget.type, data, palette)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChartByType(
  type: string,
  data: unknown[],
  palette: ReturnType<typeof getPaletteById>
) {
  const safeData = (data as Record<string, unknown>[]) ?? [];

  if (type === "pie") {
    return (
      <PieChart>
        <Pie
          data={safeData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="70%"
          label={(entry: { name?: string; value?: number }) =>
            `${entry.name ?? ""}: ${entry.value ?? 0}`
          }
        >
          {safeData.map((_, i) => (
            <Cell key={i} fill={palette.colors[i % palette.colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 14 }} />
      </PieChart>
    );
  }

  if (type === "bar") {
    return (
      <BarChart data={safeData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 13 }} />
        <YAxis tick={{ fontSize: 13 }} />
        <Tooltip
          contentStyle={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Bar dataKey="value" fill={palette.primary} radius={[8, 8, 0, 0]} />
      </BarChart>
    );
  }

  if (type === "table") {
    const columns = safeData.length > 0 ? Object.keys(safeData[0]) : [];
    return (
      <div className="max-h-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wider uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeData.map((row, i) => (
              <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/5">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: line chart
  return (
    <AreaChart data={safeData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
      <defs>
        <linearGradient id="presentation-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.primary} stopOpacity={0.6} />
          <stop offset="100%" stopColor={palette.primary} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="name" tick={{ fontSize: 13 }} />
      <YAxis tick={{ fontSize: 13 }} />
      <Tooltip
        contentStyle={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "none",
          borderRadius: 8,
          color: "#fff",
        }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke={palette.primary}
        strokeWidth={3}
        fill="url(#presentation-gradient)"
        dot={{ r: 4, fill: palette.primary }}
        activeDot={{ r: 6 }}
      />
      <Line type="monotone" dataKey="value" stroke={palette.primary} strokeWidth={0} dot={false} />
    </AreaChart>
  );
}

function generateDemoData(widget: Widget): unknown[] {
  if (widget.type === "pie") {
    return generatePieData();
  }
  if (widget.type === "table") {
    return generateTableData();
  }
  return generateTimeSeriesData(12);
}
