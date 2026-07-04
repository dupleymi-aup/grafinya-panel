"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGraphinyaStore, type TimeRange } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import type { Dashboard, Widget, DataSource, WidgetType } from "@/lib/grafinya-api";
import {
  DEMO_DASHBOARDS,
  generateTimeSeriesData,
  generatePieData,
  generateTableData,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  LayoutDashboard,
  RefreshCw,
  BarChart3,
  Table2,
  Clock,
  Maximize2,
  TrendingUp,
  Activity,
  Database,
  Zap,
  Plus,
  Trash2,
  Edit3,
  Star,
  Settings2,
  X,
  Save,
  GripVertical,
  Lock,
  Unlock,
  Play,
  History,
} from "lucide-react";
import {
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
import { useToast } from "@/hooks/use-toast";
import { PresentationMode } from "@/components/presentation-mode";
import {
  DashboardHistory,
  loadHistoryFromStorage,
  saveHistoryToStorage,
  pushSnapshot,
  type DashboardSnapshot,
} from "@/components/dashboard-history";

const CHART_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

const WIDGET_TYPES: { value: WidgetType; label: string; icon: React.ReactNode }[] = [
  { value: "line", label: "Линейный график", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "area", label: "Area график", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "bar", label: "Столбчатая диаграмма", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "pie", label: "Круговая диаграмма", icon: <Activity className="h-4 w-4" /> },
  { value: "table", label: "Таблица", icon: <Table2 className="h-4 w-4" /> },
  { value: "gauge", label: "Индикатор", icon: <Activity className="h-4 w-4" /> },
];

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  line: <TrendingUp className="h-3.5 w-3.5" />,
  area: <TrendingUp className="h-3.5 w-3.5" />,
  bar: <BarChart3 className="h-3.5 w-3.5" />,
  pie: <Activity className="h-3.5 w-3.5" />,
  table: <Table2 className="h-3.5 w-3.5" />,
  gauge: <Activity className="h-3.5 w-3.5" />,
};

/**
 * Build a human-readable label for a snapshot based on what changed
 * relative to the previous snapshot.
 */
function deriveSnapshotLabel(
  prev: { t?: string; w?: string[]; v?: string[] },
  dashboard: Dashboard
): string {
  const changes: string[] = [];
  if (prev.t !== dashboard.title) changes.push("переименование");
  const prevWidgets = new Set(prev.w ?? []);
  const currWidgets = new Set(dashboard.widgets?.map((w) => w.id) ?? []);
  const added = [...currWidgets].filter((id) => !prevWidgets.has(id)).length;
  const removed = [...prevWidgets].filter((id) => !currWidgets.has(id)).length;
  if (added > 0) changes.push(`+${added} виджет`);
  if (removed > 0) changes.push(`-${removed} виджет`);
  if (added === 0 && removed === 0 && (prev.w?.length ?? 0) === (dashboard.widgets?.length ?? 0)) {
    changes.push("переупорядочивание");
  }
  const prevVars = new Set(prev.v ?? []);
  const currVars = new Set(dashboard.variables?.map((v) => `${v.name}=${v.current}`) ?? []);
  if (prevVars.size !== currVars.size || [...currVars].some((v) => !prevVars.has(v))) {
    changes.push("переменные");
  }
  if (changes.length === 0) return "Изменение состояния";
  return `Авто — ${changes.join(", ")}`;
}

export function DashboardDetailView() {
  const {
    selectedDashboardId,
    setCurrentView,
    setSelectedDashboardId,
    connectionStatus,
    timeRange,
    setTimeRange,
    dashboards,
    dataSources,
    toggleDashboardFavorite,
    addWidgetToDashboard,
    updateWidgetInDashboard,
    removeWidgetFromDashboard,
    reorderWidgetsInDashboard,
    updateVariableInDashboard,
    addRecentItem,
    logActivity,
  } = useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState<Widget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [editMode, setEditMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const widgets = useMemo(() => dashboard?.widgets || [], [dashboard?.widgets]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !dashboard) return;
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const newOrder = arrayMove(widgets, oldIndex, newIndex).map((w) => w.id);
      reorderWidgetsInDashboard(dashboard._id, newOrder);
      logActivity({
        action: "Виджеты переупорядочены",
        category: "dashboard",
        details: `Дашборд: ${dashboard.title}`,
        targetId: dashboard._id,
        targetType: "dashboard",
      });
      toast({ title: "Порядок виджетов обновлён", description: "Изменения сохранены" });
    },
    [dashboard, widgets, reorderWidgetsInDashboard, logActivity, toast]
  );

  // Generate chart data based on time range
  const chartData = useMemo(() => {
    const pointsMap: Record<string, number> = {
      "15m": 15,
      "1h": 24,
      "6h": 36,
      "24h": 48,
      "7d": 56,
      "30d": 60,
    };
    return generateTimeSeriesData(pointsMap[timeRange] || 24);
  }, [timeRange]);

  const pieData = useMemo(() => generatePieData(), []);
  const tableData = useMemo(() => generateTableData(), []);

  const fetchDashboard = useCallback(async () => {
    if (!selectedDashboardId) return;
    setLoading(true);
    try {
      let loaded: Dashboard | null = null;
      if (connectionStatus === "demo") {
        const found = DEMO_DASHBOARDS.find((d) => d._id === selectedDashboardId);
        // Also check the live store dashboards for user-created ones
        const fromStore = dashboards.find((d) => d._id === selectedDashboardId);
        loaded = fromStore || found || null;
      } else if (connectionStatus === "connected") {
        loaded = await call<Dashboard>({
          path: `/dashboards/${selectedDashboardId}`,
        });
      }
      setDashboard(loaded);
      if (loaded) {
        addRecentItem({
          id: loaded._id,
          type: "dashboard",
          title: loaded.title,
        });
        logActivity({
          action: "Просмотр дашборда",
          category: "navigation",
          details: loaded.title,
          targetId: loaded._id,
          targetType: "dashboard",
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDashboardId, connectionStatus, call, dashboards, addRecentItem, logActivity]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Re-sync dashboard when store dashboards change
  useEffect(() => {
    if (selectedDashboardId) {
      const updated = dashboards.find((d) => d._id === selectedDashboardId);
      if (updated && connectionStatus === "demo") {
        setDashboard(updated);
      }
    }
  }, [dashboards, selectedDashboardId, connectionStatus]);

  // Auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (
      dashboard?.refreshTime &&
      dashboard.refreshTime > 0 &&
      (connectionStatus === "connected" || connectionStatus === "demo")
    ) {
      refreshIntervalRef.current = setInterval(() => {
        setLastRefresh(new Date());
        if (connectionStatus === "demo") {
          // Re-generate demo data by re-rendering
          setDashboard((prev) => (prev ? { ...prev } : null));
        }
      }, dashboard.refreshTime);
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [dashboard?.refreshTime, connectionStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLastRefresh(new Date());
    if (connectionStatus !== "demo") {
      await fetchDashboard();
    } else {
      setDashboard((prev) => (prev ? { ...prev } : null));
    }
    setRefreshing(false);
    toast({ title: "Дашборд обновлён", description: "Данные обновлены успешно" });
  };

  const handleBack = () => {
    setSelectedDashboardId(null);
    setCurrentView("dashboards");
  };

  const handleToggleFavorite = () => {
    if (dashboard) {
      toggleDashboardFavorite(dashboard._id);
      setDashboard((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      toast({
        title: dashboard.isFavorite ? "Убрано из избранного" : "Добавлено в избранное",
        description: dashboard.title,
      });
    }
  };

  const handleSaveDashboardInfo = async () => {
    if (!dashboard) return;
    if (connectionStatus === "demo") {
      const store = useGraphinyaStore.getState();
      store.updateDashboard(dashboard._id, { title: editTitle, description: editDesc });
      setDashboard((prev) => (prev ? { ...prev, title: editTitle, description: editDesc } : null));
    } else {
      try {
        await call({
          path: `/dashboards/${dashboard._id}`,
          method: "PUT",
          body: { title: editTitle, description: editDesc },
        });
        setDashboard((prev) =>
          prev ? { ...prev, title: editTitle, description: editDesc } : null
        );
      } catch {
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось обновить дашборд",
          variant: "destructive",
        });
      }
    }
    setIsEditingDashboard(false);
    toast({ title: "Дашборд обновлён", description: editTitle });
  };

  const handleVariableChange = (varName: string, newValue: string) => {
    if (!dashboard) return;
    if (connectionStatus === "demo") {
      updateVariableInDashboard(dashboard._id, varName, newValue);
    }
    setDashboard((prev) =>
      prev
        ? {
            ...prev,
            variables: prev.variables?.map((v) =>
              v.name === varName ? { ...v, current: newValue } : v
            ),
          }
        : null
    );
  };

  const handleAddWidget = () => {
    setEditingWidget(null);
    setShowWidgetEditor(true);
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setShowWidgetEditor(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    if (connectionStatus === "demo") {
      removeWidgetFromDashboard(dashboard._id, widgetId);
    }
    setDashboard((prev) =>
      prev ? { ...prev, widgets: prev.widgets?.filter((w) => w.id !== widgetId) } : null
    );
    toast({ title: "Виджет удалён", description: "Виджет был удалён из дашборда" });
    // Snapshot will be captured in a follow-up effect when dashboard updates
  };

  // ---- Snapshot creation: whenever the dashboard's widgets/variables/title
  // change (except when restoring from history), capture a new snapshot.
  const prevSnapshotRef = useRef<string>("");
  useEffect(() => {
    if (!dashboard) return;
    // Build a fingerprint to detect actual changes
    const fingerprint = JSON.stringify({
      t: dashboard.title,
      w: dashboard.widgets?.map((w) => w.id) ?? [],
      v: dashboard.variables?.map((v) => `${v.name}=${v.current}`) ?? [],
    });
    if (fingerprint === prevSnapshotRef.current) return;
    if (!prevSnapshotRef.current) {
      // First mount — don't snapshot, just record the fingerprint
      prevSnapshotRef.current = fingerprint;
      // Refresh snapshot count from storage
      const all = loadHistoryFromStorage();
      setSnapshotCount(all[dashboard._id]?.length ?? 0);
      return;
    }
    prevSnapshotRef.current = fingerprint;

    // Determine label based on what changed
    const prev = JSON.parse(prevSnapshotRef.current || "{}");
    const label = deriveSnapshotLabel(prev, dashboard);

    const updated = pushSnapshot(loadHistoryFromStorage(), dashboard, label, "auto");
    saveHistoryToStorage(updated);
    setSnapshotCount(updated[dashboard._id]?.length ?? 0);
  }, [dashboard]);

  const handleRestoreSnapshot = (snapshot: DashboardSnapshot) => {
    if (!dashboard) return;
    setDashboard((prev) =>
      prev
        ? {
            ...prev,
            widgets: snapshot.widgets.map((w) => ({ ...w })),
            variables: (snapshot.variables ?? []).map((v) => ({ ...v })),
            title: snapshot.title,
          }
        : null
    );
    prevSnapshotRef.current = JSON.stringify({
      t: snapshot.title,
      w: snapshot.widgets.map((w) => w.id),
      v: (snapshot.variables ?? []).map((v) => `${v.name}=${v.current}`),
    });
  };

  // Keyboard shortcut: F to enter presentation mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "f" &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setPresentationMode(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h" && !e.shiftKey) {
        e.preventDefault();
        setHistoryOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleWidgetSaved = (widget: Widget) => {
    if (!dashboard) return;
    if (editingWidget) {
      // Update existing
      if (connectionStatus === "demo") {
        updateWidgetInDashboard(dashboard._id, widget.id, widget);
      }
      setDashboard((prev) =>
        prev
          ? { ...prev, widgets: prev.widgets?.map((w) => (w.id === widget.id ? widget : w)) }
          : null
      );
      toast({ title: "Виджет обновлён", description: widget.title });
    } else {
      // Add new
      if (connectionStatus === "demo") {
        addWidgetToDashboard(dashboard._id, widget);
      }
      setDashboard((prev) =>
        prev ? { ...prev, widgets: [...(prev.widgets || []), widget] } : null
      );
      toast({ title: "Виджет добавлен", description: widget.title });
    }
    setShowWidgetEditor(false);
    setEditingWidget(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutDashboard className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Дашборд не найден</h3>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>
      </div>
    );
  }

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  // Stat cards for dashboard overview
  const statCards = [
    {
      label: "Виджетов",
      value: widgets.length,
      icon: <BarChart3 className="h-4 w-4" />,
      color: "text-amber-500",
    },
    {
      label: "Источников",
      value: new Set(widgets.map((w) => w.dataSourceId).filter(Boolean)).size,
      icon: <Database className="h-4 w-4" />,
      color: "text-emerald-500",
    },
    {
      label: "Обновление",
      value: dashboard.refreshTime ? `${(dashboard.refreshTime / 1000).toFixed(0)}с` : "—",
      icon: <Clock className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      label: "Переменных",
      value: dashboard.variables?.length || 0,
      icon: <Zap className="h-4 w-4" />,
      color: "text-violet-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isEditingDashboard ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-9 w-64 text-lg font-bold"
                placeholder="Название дашборда"
              />
              <Button
                size="icon"
                onClick={handleSaveDashboardInfo}
                className="h-9 w-9 bg-amber-500 text-white hover:bg-amber-600"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingDashboard(false)}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{dashboard.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleToggleFavorite}
                >
                  <Star
                    className={`h-4 w-4 ${
                      dashboard.isFavorite
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
              {dashboard.description && (
                <p className="text-muted-foreground mt-0.5 text-sm">{dashboard.description}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditTitle(dashboard.title);
                setEditDesc(dashboard.description || "");
                setIsEditingDashboard(true);
              }}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          {/* Time range picker */}
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <Clock className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15 мин</SelectItem>
              <SelectItem value="1h">1 час</SelectItem>
              <SelectItem value="6h">6 часов</SelectItem>
              <SelectItem value="24h">24 часа</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          {/* History button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            title="История изменений (Ctrl+H)"
          >
            <History className="mr-2 h-4 w-4" />
            История
            {snapshotCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-[16px] justify-center py-0 text-[10px]"
              >
                {snapshotCount}
              </Badge>
            )}
          </Button>
          {/* Presentation mode button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPresentationMode(true)}
            title="Режим презентации (F)"
          >
            <Play className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Презентация</span>
          </Button>
          {isConnected && (
            <>
              <Button
                size="sm"
                variant={editMode ? "default" : "outline"}
                onClick={() => {
                  setEditMode(!editMode);
                  toast({
                    title: editMode ? "Режим просмотра" : "Режим редактирования",
                    description: editMode
                      ? "Изменения сохранены"
                      : "Перетащите виджеты для изменения порядка",
                  });
                }}
                className={editMode ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
                title={editMode ? "Выйти из режима редактирования" : "Войти в режим редактирования"}
              >
                {editMode ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                {editMode ? "Завершить" : "Изменить"}
              </Button>
              <Button
                size="sm"
                onClick={handleAddWidget}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Виджет
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          <GripVertical className="h-4 w-4 shrink-0" />
          <span>
            <strong>Режим редактирования:</strong> перетащите виджеты за ручку слева, чтобы изменить
            порядок. Используйте кнопки на карточках для редактирования и удаления.
          </span>
        </div>
      )}

      {/* Last refresh time */}
      <p className="text-muted-foreground text-xs">
        Последнее обновление: {lastRefresh.toLocaleTimeString("ru-RU")}
        {dashboard.refreshTime && dashboard.refreshTime > 0 && (
          <span className="text-muted-foreground/60 ml-2">
            (авто-обновление каждые {(dashboard.refreshTime / 1000).toFixed(0)}с)
          </span>
        )}
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card flex items-center gap-3 rounded-xl border p-3">
            <div className={`${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-lg leading-none font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Variables - interactive selectors */}
      {dashboard.variables && dashboard.variables.length > 0 && (
        <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-xl p-4">
          <span className="text-muted-foreground text-sm font-medium">Переменные:</span>
          {dashboard.variables.map((v) => (
            <div key={v.name} className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">{v.name}:</span>
              {v.values && v.values.length > 0 ? (
                <Select
                  value={v.current || ""}
                  onValueChange={(val) => handleVariableChange(v.name, val)}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {v.values.map((val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {v.current || "(не выбрано)"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {dashboard.tags && dashboard.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dashboard.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Widgets grid */}
      {widgets.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id || "")} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {widgets.map((widget, idx) => {
                const isWide = (widget.cols || 1) >= 2;
                return (
                  <SortableWidgetCard
                    key={widget.id || idx}
                    widget={widget}
                    idx={idx}
                    isWide={isWide}
                    isConnected={isConnected}
                    editMode={editMode}
                    renderWidget={renderWidget}
                    chartData={chartData}
                    pieData={pieData}
                    tableData={tableData}
                    onEdit={handleEditWidget}
                    onDelete={handleDeleteWidget}
                    onFullscreen={setFullscreenWidget}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Виджетов пока нет</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Добавьте виджеты к дашборду для визуализации данных
          </p>
          {isConnected && (
            <Button
              onClick={handleAddWidget}
              className="mt-4 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить виджет
            </Button>
          )}
        </div>
      )}

      {/* Widget Editor Dialog */}
      <WidgetEditorDialog
        key={editingWidget?.id || "new-widget"}
        open={showWidgetEditor}
        onOpenChange={setShowWidgetEditor}
        widget={editingWidget}
        dataSources={connectionStatus === "demo" ? [] : dataSources}
        onSave={handleWidgetSaved}
        isDemo={connectionStatus === "demo"}
      />

      {/* Fullscreen Widget Modal */}
      {fullscreenWidget && (
        <Dialog open={!!fullscreenWidget} onOpenChange={() => setFullscreenWidget(null)}>
          <DialogContent className="h-[80vh] max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {WIDGET_ICONS[fullscreenWidget.type] || <BarChart3 className="h-5 w-5" />}
                {fullscreenWidget.title || "Без названия"}
                <Badge variant="outline" className="text-xs">
                  {fullscreenWidget.type}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="h-full flex-1">
              {renderWidget(
                fullscreenWidget,
                widgets.indexOf(fullscreenWidget),
                chartData,
                pieData,
                tableData,
                true
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dashboard history dialog */}
      {dashboard && (
        <DashboardHistory
          dashboardId={dashboard._id}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onRestore={handleRestoreSnapshot}
        />
      )}

      {/* Presentation mode */}
      {presentationMode && dashboard && (
        <PresentationMode dashboardId={dashboard._id} onExit={() => setPresentationMode(false)} />
      )}
    </div>
  );
}

// ---- Widget Editor Dialog ----
function WidgetEditorDialog({
  open,
  onOpenChange,
  widget,
  dataSources,
  onSave,
  isDemo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: Widget | null;
  dataSources: DataSource[];
  onSave: (widget: Widget) => void;
  isDemo: boolean;
}) {
  const [title, setTitle] = useState(widget?.title || "");
  const [type, setType] = useState<WidgetType>(widget?.type || "line");
  const [cols, setCols] = useState(widget?.cols || 1);
  const [rows, setRows] = useState(widget?.rows || 2);
  const [dataSourceId, setDataSourceId] = useState(widget?.dataSourceId || "");
  const [query, setQuery] = useState(widget?.query || "");

  const handleSave = () => {
    if (!title.trim()) return;
    const savedWidget: Widget = {
      id: widget?.id || `w-${Date.now()}`,
      title: title.trim(),
      type,
      cols,
      rows,
      dataSourceId: dataSourceId || undefined,
      query: query || undefined,
    };
    onSave(savedWidget);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-amber-500" />
            {widget ? "Редактировать виджет" : "Новый виджет"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              placeholder="Название виджета"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Тип визуализации</Label>
            <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      {t.icon}
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ширина (колонки)</Label>
              <Select value={String(cols)} onValueChange={(v) => setCols(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 колонка</SelectItem>
                  <SelectItem value="2">2 колонки</SelectItem>
                  <SelectItem value="3">3 колонки</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Высота (ряды)</Label>
              <Select value={String(rows)} onValueChange={(v) => setRows(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ряд</SelectItem>
                  <SelectItem value="2">2 ряда</SelectItem>
                  <SelectItem value="3">3 ряда</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isDemo && dataSources.length > 0 && (
            <div className="space-y-2">
              <Label>Источник данных</Label>
              <Select value={dataSourceId} onValueChange={setDataSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите источник" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((ds) => (
                    <SelectItem key={ds._id} value={ds._id}>
                      {ds.name} ({ds.pluginId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isDemo && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-600 dark:text-violet-400">
              В демо-режиме источник данных привязывается автоматически
            </div>
          )}
          <div className="space-y-2">
            <Label>Запрос</Label>
            <Input
              placeholder='metric="cpu_usage" или SQL запрос'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Save className="mr-2 h-4 w-4" />
            {widget ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Widget Renderers ----
function renderWidget(
  widget: Widget,
  idx: number,
  chartData: ReturnType<typeof generateTimeSeriesData>,
  pieData: ReturnType<typeof generatePieData>,
  tableData: ReturnType<typeof generateTableData>,
  isFullscreen = false
) {
  const color = CHART_COLORS[idx % CHART_COLORS.length];
  const color2 = CHART_COLORS[(idx + 1) % CHART_COLORS.length];
  const height = "100%";

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
  };

  switch (widget.type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`gradient2-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color2} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color2} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: isFullscreen ? 11 : 9 }}
              stroke="var(--muted-foreground)"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: isFullscreen ? 11 : 9 }}
              stroke="var(--muted-foreground)"
              width={isFullscreen ? 50 : 35}
            />
            <Tooltip contentStyle={tooltipStyle} />
            {isFullscreen && <Legend />}
            <Area
              type="monotone"
              dataKey={idx % 3 === 0 ? "cpu" : idx % 3 === 1 ? "memory" : "requests"}
              stroke={color}
              fill={`url(#gradient-${idx})`}
              strokeWidth={2}
              name={widget.title}
            />
            <Area
              type="monotone"
              dataKey="latency"
              stroke={color2}
              fill={isFullscreen ? `url(#gradient2-${idx})` : "none"}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              name="Latency"
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "bar":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData.slice(-8)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: isFullscreen ? 11 : 9 }}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              tick={{ fontSize: isFullscreen ? 11 : 9 }}
              stroke="var(--muted-foreground)"
              width={isFullscreen ? 50 : 35}
            />
            <Tooltip contentStyle={tooltipStyle} />
            {isFullscreen && <Legend />}
            <Bar
              dataKey={idx % 2 === 0 ? "disk_read" : "network_in"}
              fill={color}
              radius={[3, 3, 0, 0]}
              name={idx % 2 === 0 ? "Чтение" : "Входящий"}
            />
            <Bar
              dataKey={idx % 2 === 0 ? "disk_write" : "network_out"}
              fill={color2}
              radius={[3, 3, 0, 0]}
              name={idx % 2 === 0 ? "Запись" : "Исходящий"}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={isFullscreen ? 150 : 55}
              innerRadius={isFullscreen ? 90 : 30}
              paddingAngle={2}
              label={isFullscreen}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            {isFullscreen && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );

    case "table":
    default:
      return (
        <div className="h-full space-y-1.5 overflow-hidden">
          <div className="text-muted-foreground grid grid-cols-4 gap-2 border-b pb-1.5 text-[10px] font-medium">
            <span>Сервис</span>
            <span>Статус</span>
            <span className="text-right">Uptime</span>
            <span className="text-right">Latency</span>
          </div>
          <div
            className={`space-y-1 overflow-y-auto ${isFullscreen ? "max-h-[60vh]" : "max-h-32"}`}
          >
            {tableData.map((row) => (
              <div
                key={row.name}
                className="border-border/30 hover:bg-muted/30 grid grid-cols-4 gap-2 rounded border-b px-1 py-1 text-[10px]"
              >
                <span className="truncate font-medium">{row.name}</span>
                <span>
                  <Badge
                    variant="outline"
                    className={`px-1 py-0 text-[8px] ${
                      row.status === "healthy"
                        ? "border-emerald-500/30 text-emerald-600"
                        : row.status === "warning"
                          ? "border-amber-500/30 text-amber-600"
                          : "border-red-500/30 text-red-600"
                    }`}
                  >
                    {row.status === "healthy" ? "OK" : row.status === "warning" ? "WARN" : "CRIT"}
                  </Badge>
                </span>
                <span className="text-right font-mono">{row.uptime}</span>
                <span className="text-right font-mono">{row.latency}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}

// ---- Sortable Widget Card for drag-and-drop ----
interface SortableWidgetCardProps {
  widget: Widget;
  idx: number;
  isWide: boolean;
  isConnected: boolean;
  editMode: boolean;
  renderWidget: (
    widget: Widget,
    idx: number,
    chartData: ReturnType<typeof generateTimeSeriesData>,
    pieData: ReturnType<typeof generatePieData>,
    tableData: ReturnType<typeof generateTableData>
  ) => React.ReactNode;
  chartData: ReturnType<typeof generateTimeSeriesData>;
  pieData: ReturnType<typeof generatePieData>;
  tableData: ReturnType<typeof generateTableData>;
  onEdit: (widget: Widget) => void;
  onDelete: (id: string) => void;
  onFullscreen: (widget: Widget) => void;
}

function SortableWidgetCard({
  widget,
  idx,
  isWide,
  isConnected,
  editMode,
  renderWidget,
  chartData,
  pieData,
  tableData,
  onEdit,
  onDelete,
  onFullscreen,
}: SortableWidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id || `widget-${idx}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isWide ? "md:col-span-2" : ""} ${isDragging ? "rounded-xl ring-2 ring-amber-500" : ""}`}
    >
      <Card className="group h-full overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 truncate text-sm font-medium">
              {editMode && (
                <button
                  ref={setActivatorNodeRef}
                  {...attributes}
                  {...listeners}
                  className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                  title="Перетащите для изменения порядка"
                  aria-label="Перетащите виджет"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
              )}
              {WIDGET_ICONS[widget.type] || <BarChart3 className="h-3.5 w-3.5" />}
              {widget.title || "Без названия"}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-1.5 text-[10px]">
                {widget.type || "chart"}
              </Badge>
              {editMode && isConnected && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onEdit(widget)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onDelete(widget.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              {!editMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onFullscreen(widget)}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {widget.dataSourceId ? (
            <div className="h-44">{renderWidget(widget, idx, chartData, pieData, tableData)}</div>
          ) : (
            <div className="text-muted-foreground flex h-44 flex-col items-center justify-center">
              <Table2 className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-xs">Нет данных</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
