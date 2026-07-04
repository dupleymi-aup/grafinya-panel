"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import { useGraphinyaQuery } from "@/hooks/use-graphinya-query";
import { useTranslation } from "@/hooks/use-translation";
import type { Dashboard } from "@/lib/grafinya-api";
import { DEMO_DASHBOARDS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Plus,
  Star,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  Tag,
  Sparkles,
  Clock,
  Download,
  Upload,
  LayoutTemplate,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardTemplates } from "@/components/dashboard-templates";
import { BulkActionsBar, SelectionModeButton } from "@/components/bulk-actions";

export function DashboardsView() {
  const {
    dashboards,
    setDashboards,
    setSelectedDashboardId,
    setCurrentView,
    connectionStatus,
    isDemoMode,
    toggleDashboardFavorite,
  } = useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  const { isLoading } = useGraphinyaQuery<Dashboard>({
    queryKey: "dashboards",
    apiPath: "/dashboards",
    setter: setDashboards,
    demoData: DEMO_DASHBOARDS,
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (isDemoMode) {
      const newDashboard: Dashboard = {
        _id: `dash-${Date.now()}`,
        title: newTitle,
        description: newDesc || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isFavorite: false,
        createdBy: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        widgets: [],
        variables: [],
        refreshTime: 30000,
      };
      setDashboards([...dashboards, newDashboard]);
      toast({ title: "Дашборд создан", description: newTitle });
    } else {
      try {
        await call({
          path: "/dashboards",
          method: "POST",
          body: { title: newTitle, description: newDesc, tags },
        });
        toast({ title: "Дашборд создан", description: newTitle });
        queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось создать дашборд",
          variant: "destructive",
        });
      }
    }
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
    setNewTags("");
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setDashboards(dashboards.filter((d) => d._id !== id));
      toast({ title: "Дашборд удалён" });
      return;
    }
    try {
      await call({ path: `/dashboards/${id}`, method: "DELETE" });
      toast({ title: "Дашборд удалён" });
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const handleDuplicate = (dashboard: Dashboard) => {
    if (isDemoMode) {
      const dup: Dashboard = {
        ...dashboard,
        _id: `dash-${Date.now()}`,
        title: `${dashboard.title} (копия)`,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDashboards([...dashboards, dup]);
      toast({ title: "Дашборд дублирован", description: dup.title });
    }
  };

  const handleExport = (dashboard: Dashboard) => {
    const json = JSON.stringify(dashboard, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dashboard.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Дашборд экспортирован", description: dashboard.title });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string) as Partial<Dashboard>;
          const newDashboard: Dashboard = {
            _id: `dash-${Date.now()}`,
            title: imported.title || "Импортированный дашборд",
            description: imported.description,
            tags: imported.tags,
            isFavorite: false,
            createdBy: "import",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            widgets: imported.widgets || [],
            variables: imported.variables || [],
            refreshTime: imported.refreshTime || 30000,
          };
          setDashboards([...dashboards, newDashboard]);
          toast({
            title: "Дашборд импортирован",
            description: newDashboard.title,
          });
        } catch {
          toast({
            title: "Ошибка импорта",
            description: "Неверный формат JSON-файла",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleOpen = (id: string) => {
    setSelectedDashboardId(id);
    setCurrentView("dashboard-detail");
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDashboardFavorite(id);
    const dashboard = dashboards.find((d) => d._id === id);
    toast({
      title: dashboard?.isFavorite ? "Убрано из избранного" : "Добавлено в избранное",
      description: dashboard?.title,
    });
  };

  const filtered = dashboards.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const favorites = filtered.filter((d) => d.isFavorite);
  const regular = filtered.filter((d) => !d.isFavorite);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("views.dashboardsTitle")}</h2>
          <p className="text-muted-foreground">
            {isConnected
              ? t("views.dashboardsConnected", { count: String(dashboards.length), suffix: dashboards.length === 1 ? "" : dashboards.length < 5 ? "а" : "ов" })
              : t("views.dashboardsSubtitle")}
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <SelectionModeButton
              active={selectionMode}
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
              count={selectedIds.size}
            />
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              {t("views.dashboardsTemplates")}
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              {t("views.dashboardsImport")}
            </Button>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Новый дашборд
            </Button>
          </div>
        )}
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <LayoutDashboard className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Подключитесь к серверу или включите демо-режим для просмотра дашбордов.
          </p>
        </div>
      )}

      {/* Demo mode badge */}
      {isDemoMode && (
        <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <Sparkles className="h-5 w-5 shrink-0 text-violet-500" />
          <p className="text-sm text-violet-600 dark:text-violet-400">
            Демо-режим — данные сгенерированы для демонстрации возможностей
          </p>
        </div>
      )}

      {/* Search */}
      {isConnected && (
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("views.dashboardsSearch")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="bg-muted mb-2 h-4 w-3/4 rounded" />
                    <div className="bg-muted h-3 w-1/2 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="bg-muted h-3 w-full rounded" />
                  <div className="bg-muted h-3 w-2/3 rounded" />
                  <div className="mt-3 flex gap-2">
                    <div className="bg-muted h-5 w-16 rounded" />
                    <div className="bg-muted h-5 w-12 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Favorites */}
      {!isLoading && favorites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Избранные
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((dashboard) => (
              <DashboardCard
                key={dashboard._id}
                dashboard={dashboard}
                onOpen={handleOpen}
                onDelete={setDeleteTarget}
                onToggleFavorite={handleToggleFavorite}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                isDemo={isDemoMode}
                selectionMode={selectionMode}
                selected={selectedIds.has(dashboard._id)}
                onToggleSelection={toggleSelection}
              />
            ))}
          </div>
        </div>
      )}

      {/* All dashboards */}
      {!isLoading && regular.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">Все дашборды</h3>
            {selectionMode && regular.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => toggleAll(regular.map((d) => d._id))}
              >
                {regular.every((d) => selectedIds.has(d._id)) ? t("views.dashboardsDeselectAll") : t("views.dashboardsSelectAll")}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regular.map((dashboard) => (
              <DashboardCard
                key={dashboard._id}
                dashboard={dashboard}
                onOpen={handleOpen}
                onDelete={setDeleteTarget}
                onToggleFavorite={handleToggleFavorite}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                isDemo={isDemoMode}
                selectionMode={selectionMode}
                selected={selectedIds.has(dashboard._id)}
                onToggleSelection={toggleSelection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && dashboards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutDashboard className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Дашбордов пока нет</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Создайте первый дашборд для начала работы
          </p>
          {isConnected && (
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Новый дашборд
            </Button>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("views.dashboardsCreateTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t("views.dashboardsCreateNamePlaceholder")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Input
              placeholder={t("views.dashboardsCreateDescPlaceholder")}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <Input
              placeholder={t("views.dashboardsCreateTagsPlaceholder")}
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <DashboardTemplates open={showTemplates} onOpenChange={setShowTemplates} />

      {/* Bulk actions bar (shown when selection mode is active) */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          dashboards={dashboards}
          onClearSelection={clearSelection}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["dashboards"] })}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить дашборд?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Дашборд и все его виджеты будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DashboardCard({
  dashboard,
  onOpen,
  onDelete,
  onToggleFavorite,
  onDuplicate,
  onExport,
  isDemo,
  selectionMode,
  selected,
  onToggleSelection,
}: {
  dashboard: Dashboard;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDuplicate: (dashboard: Dashboard) => void;
  onExport: (dashboard: Dashboard) => void;
  isDemo?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: (id: string) => void;
}) {
  return (
    <Card
      className={`group border-border/60 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        selected ? "border-amber-500/30 ring-2 ring-amber-500" : ""
      }`}
      onClick={
        selectionMode && onToggleSelection ? () => onToggleSelection(dashboard._id) : undefined
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle
            className="line-clamp-1 flex flex-1 items-center gap-2 text-base font-semibold"
            onClick={selectionMode ? undefined : () => onOpen(dashboard._id)}
          >
            {selectionMode && (
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelection?.(dashboard._id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {dashboard.title}
            {isDemo && (
              <Badge variant="outline" className="text-xs">
                Demo
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => onToggleFavorite(dashboard._id, e)}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  dashboard.isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpen(dashboard._id)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(dashboard);
              }}
              title="Дублировать"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onExport(dashboard)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dashboard._id);
              }}
              title="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent onClick={() => onOpen(dashboard._id)}>
        {dashboard.description && (
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{dashboard.description}</p>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(dashboard.updatedAt).toLocaleDateString("ru-RU")}
          </span>
          {dashboard.widgets && dashboard.widgets.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {dashboard.widgets.length} виджет
              {dashboard.widgets.length === 1 ? "" : dashboard.widgets.length < 5 ? "а" : "ов"}
            </Badge>
          )}
          {dashboard.refreshTime && (
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-2.5 w-2.5" />
              {(dashboard.refreshTime / 1000).toFixed(0)}с
            </Badge>
          )}
          {dashboard.tags && dashboard.tags.length > 0 && (
            <div className="flex gap-1">
              {dashboard.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
