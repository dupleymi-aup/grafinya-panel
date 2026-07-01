"use client";

import { useEffect, useState, useCallback } from "react";
import { useGraphinyaStore } from "@/lib/store";
import type { Dashboard, Widget } from "@/lib/grafinya-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  History,
  Undo2,
  Redo2,
  RotateCcw,
  Trash2,
  Clock,
  ChevronRight,
  Save,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * In-memory snapshot of a dashboard at a point in time.
 * Used for undo/redo within the dashboard editor.
 */
export interface DashboardSnapshot {
  id: string;
  dashboardId: string;
  timestamp: number;
  label: string;
  /** Snapshot of widget array at this point */
  widgets: Widget[];
  /** Snapshot of variables */
  variables: NonNullable<Dashboard["variables"]>;
  /** Snapshot of title (in case user renames) */
  title: string;
  /** Was this snapshot created by user action or auto-saved? */
  source: "user" | "auto";
}

interface DashboardHistoryProps {
  dashboardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (snapshot: DashboardSnapshot) => void;
}

const HISTORY_STORAGE_KEY = "graphinya-dashboard-history";
const MAX_SNAPSHOTS = 50;

/**
 * Persisted history store for dashboard edits.
 *
 * Snapshots are kept in localStorage so they survive page reloads.
 * Each dashboard has its own append-only list of snapshots, capped
 * at MAX_SNAPSHOTS to prevent unbounded growth.
 */
export function loadHistoryFromStorage(): Record<string, DashboardSnapshot[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DashboardSnapshot[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveHistoryToStorage(history: Record<string, DashboardSnapshot[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* quota exceeded — silently drop */
  }
}

/**
 * Helper: push a new snapshot into the history map for a given dashboard.
 * Returns the updated history map.
 */
export function pushSnapshot(
  history: Record<string, DashboardSnapshot[]>,
  dashboard: Dashboard,
  label: string,
  source: "user" | "auto" = "user"
): Record<string, DashboardSnapshot[]> {
  const snapshot: DashboardSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dashboardId: dashboard._id,
    timestamp: Date.now(),
    label,
    source,
    widgets: (dashboard.widgets ?? []).map((w) => ({ ...w })),
    variables: (dashboard.variables ?? []).map((v) => ({ ...v })),
    title: dashboard.title,
  };

  const list = history[dashboard._id] ?? [];
  const newList = [snapshot, ...list].slice(0, MAX_SNAPSHOTS);
  return { ...history, [dashboard._id]: newList };
}

/**
 * Dialog showing the version history of a dashboard.
 * Users can preview, restore, or delete snapshots.
 */
export function DashboardHistory({
  dashboardId,
  open,
  onOpenChange,
  onRestore,
}: DashboardHistoryProps) {
  const { dashboards, updateDashboard } = useGraphinyaStore();
  const { toast } = useToast();
  const [history, setHistory] = useState<Record<string, DashboardSnapshot[]>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Load history from localStorage on mount and when dialog opens
  useEffect(() => {
    if (!open) return;
    // Use a microtask to avoid synchronous setState in effect body
    const id = window.setTimeout(() => {
      setHistory(loadHistoryFromStorage());
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const dashboard = dashboards.find((d) => d._id === dashboardId);
  const snapshots = history[dashboardId] ?? [];
  const previewSnapshot = snapshots.find((s) => s.id === previewId) ?? null;

  const handleRestore = useCallback(
    (snapshot: DashboardSnapshot) => {
      if (!dashboard) return;
      updateDashboard(dashboardId, {
        widgets: snapshot.widgets.map((w) => ({ ...w })),
        variables: (snapshot.variables ?? []).map((v) => ({ ...v })),
        title: snapshot.title,
      });
      onRestore(snapshot);
      toast({
        title: "Версия восстановлена",
        description: `Состояние «${snapshot.label}» от ${formatTime(snapshot.timestamp)} применено.`,
      });
      onOpenChange(false);
    },
    [dashboard, dashboardId, updateDashboard, onRestore, onOpenChange, toast]
  );

  const handleClearAll = useCallback(() => {
    setHistory((prev) => {
      const updated = { ...prev, [dashboardId]: [] };
      saveHistoryToStorage(updated);
      return updated;
    });
    setPreviewId(null);
    toast({
      title: "История очищена",
      description: "Все снимки состояния для этого дашборда удалены.",
    });
  }, [dashboardId, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-500" />
            История изменений дашборда
          </DialogTitle>
          <DialogDescription>
            Просмотр и восстановление предыдущих версий дашборда «{dashboard?.title}». Снимки
            создаются автоматически при изменении виджетов и переменных.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[50vh] grid-cols-1 gap-4 md:grid-cols-2">
          {/* Snapshot list */}
          <div className="flex flex-col overflow-hidden rounded-lg border">
            <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2">
              <span className="text-muted-foreground text-xs font-medium">
                Снимки состояния ({snapshots.length})
              </span>
              {snapshots.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-7 text-xs"
                  onClick={handleClearAll}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Очистить
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              {snapshots.length === 0 ? (
                <div className="text-muted-foreground space-y-2 p-6 text-center text-sm">
                  <History className="mx-auto h-8 w-8 opacity-40" />
                  <p>История пуста</p>
                  <p className="text-xs">
                    Изменения, внесённые в дашборд, будут автоматически сохраняться здесь.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {snapshots.map((snap, idx) => (
                    <button
                      key={snap.id}
                      onClick={() => setPreviewId(snap.id)}
                      className={`w-full rounded-md border p-2 text-left transition-colors ${
                        previewId === snap.id
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "hover:bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {idx === 0 ? (
                              <Badge
                                variant="outline"
                                className="h-4 border-emerald-500/30 py-0 text-[10px] text-emerald-600"
                              >
                                Текущая
                              </Badge>
                            ) : null}
                            <span className="truncate text-sm font-medium">{snap.label}</span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {formatTime(snap.timestamp)}
                            <span>·</span>
                            <span>{snap.widgets.length} виджетов</span>
                          </div>
                        </div>
                        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Preview panel */}
          <div className="flex flex-col overflow-hidden rounded-lg border">
            <div className="bg-muted/30 border-b px-3 py-2">
              <span className="text-muted-foreground text-xs font-medium">Предпросмотр</span>
            </div>
            <ScrollArea className="flex-1">
              {previewSnapshot ? (
                <div className="space-y-3 p-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Заголовок</p>
                    <p className="text-sm font-medium">{previewSnapshot.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Время создания</p>
                    <p className="text-sm">{formatTime(previewSnapshot.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Описание</p>
                    <p className="text-sm">{previewSnapshot.label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      Виджеты ({previewSnapshot.widgets.length})
                    </p>
                    <div className="space-y-1">
                      {previewSnapshot.widgets.length === 0 ? (
                        <p className="text-muted-foreground text-xs italic">Нет виджетов</p>
                      ) : (
                        previewSnapshot.widgets.map((w) => (
                          <div
                            key={w.id}
                            className="bg-muted/30 flex items-center gap-2 rounded border p-1.5 text-xs"
                          >
                            <Eye className="text-muted-foreground h-3 w-3" />
                            <span className="flex-1 truncate font-medium">{w.title}</span>
                            <Badge variant="outline" className="h-4 py-0 text-[10px]">
                              {w.type}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {previewSnapshot.variables.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">
                        Переменные ({previewSnapshot.variables.length})
                      </p>
                      <div className="space-y-1">
                        {previewSnapshot.variables.map((v) => (
                          <div
                            key={v.name}
                            className="bg-muted/30 flex items-center gap-2 rounded border p-1.5 text-xs"
                          >
                            <span className="font-mono font-medium">{v.name}</span>
                            <span className="text-muted-foreground">=</span>
                            <span className="truncate">{v.current ?? "(не задано)"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground space-y-2 p-6 text-center text-sm">
                  <Eye className="mx-auto h-8 w-8 opacity-40" />
                  <p>Выберите снимок для предпросмотра</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            disabled={!previewSnapshot}
            onClick={() => previewSnapshot && handleRestore(previewSnapshot)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Восстановить версию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Toolbar button (compact trigger) ----
interface HistoryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  count?: number;
}

export function HistoryButton({ onClick, disabled, count }: HistoryButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-1.5"
      title="История изменений"
    >
      <History className="h-4 w-4" />
      История
      {count !== undefined && count > 0 && (
        <Badge
          variant="secondary"
          className="ml-1 h-4 min-w-[16px] justify-center py-0 text-[10px]"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}

// ---- Undo / Redo toolbar (compact) ----
interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
}: UndoRedoToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-8 w-8"
        title="Отменить (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-8 w-8"
        title="Повторить (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        className="h-8 w-8"
        title="Сохранить снимок"
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---- Helpers ----
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;

  if (diff < 60_000) return "только что";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} дн назад`;

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
