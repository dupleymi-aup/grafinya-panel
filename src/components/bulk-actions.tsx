"use client";

import { useState, useCallback } from "react";
import { useGraphinyaStore } from "@/lib/store";
import type { Dashboard } from "@/lib/grafinya-api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Trash2,
  Star,
  Tag,
  Copy,
  CheckSquare,
  ChevronDown,
  X,
  FileJson,
  FileSpreadsheet,
  Archive,
} from "lucide-react";
import { exportJSON, exportCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  dashboards: Dashboard[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

/**
 * Floating bulk-actions bar shown when one or more dashboards are selected.
 *
 * Supports: export (JSON/CSV), favorite toggle, duplicate, tag, delete.
 * The bar is positioned fixed at the bottom of the viewport so it stays
 * visible while the user scrolls through a long list of dashboards.
 */
export function BulkActionsBar({
  selectedIds,
  dashboards,
  onClearSelection,
  onRefresh,
}: BulkActionsBarProps) {
  const { toggleDashboardFavorite, updateDashboard } = useGraphinyaStore();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const selectedDashboards = dashboards.filter((d) => selectedIds.has(d._id));
  const count = selectedDashboards.length;

  const handleExportJSON = useCallback(() => {
    const payload = selectedDashboards.map((d) => ({
      _id: d._id,
      title: d.title,
      description: d.description,
      tags: d.tags,
      widgets: d.widgets,
      variables: d.variables,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
    exportJSON(
      { dashboards: payload, exportedAt: new Date().toISOString(), count },
      `grafinya-dashboards-${count}-${Date.now()}.json`
    );
    toast({
      title: "Экспорт выполнен",
      description: `Экспортировано дашбордов: ${count} (JSON).`,
    });
  }, [selectedDashboards, count, toast]);

  const handleExportCSV = useCallback(() => {
    const rows = selectedDashboards.map((d) => ({
      id: d._id,
      title: d.title,
      description: d.description ?? "",
      tags: (d.tags ?? []).join("; "),
      widgetsCount: d.widgets?.length ?? 0,
      variablesCount: d.variables?.length ?? 0,
      isFavorite: d.isFavorite ? "да" : "нет",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
    exportCSV(rows, `grafinya-dashboards-${count}-${Date.now()}.csv`);
    toast({
      title: "Экспорт выполнен",
      description: `Экспортировано дашбордов: ${count} (CSV).`,
    });
  }, [selectedDashboards, count, toast]);

  const handleToggleFavorite = useCallback(() => {
    selectedDashboards.forEach((d) => toggleDashboardFavorite(d._id));
    toast({
      title: "Избранное обновлено",
      description: `Изменено дашбордов: ${count}.`,
    });
  }, [selectedDashboards, count, toggleDashboardFavorite, toast]);

  const handleDuplicate = useCallback(() => {
    selectedDashboards.forEach((d) => {
      const copy: Dashboard = {
        ...d,
        _id: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: `${d.title} (копия)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // We don't have a direct "add dashboard" action in store, so we'll
      // simulate by updating with a fresh _id reference. In a real backend
      // scenario, the user would call an API to persist this.
      useGraphinyaStore.setState((state) => ({
        dashboards: [...state.dashboards, copy],
      }));
    });
    toast({
      title: "Дашборды дублированы",
      description: `Создано копий: ${count}.`,
    });
    onClearSelection();
    onRefresh();
  }, [selectedDashboards, count, toast, onClearSelection, onRefresh]);

  const handleDelete = useCallback(() => {
    selectedDashboards.forEach((d) => {
      useGraphinyaStore.setState((state) => ({
        dashboards: state.dashboards.filter((x) => x._id !== d._id),
      }));
    });
    toast({
      title: "Дашборды удалены",
      description: `Удалено: ${count}.`,
      variant: "destructive",
    });
    setConfirmDelete(false);
    onClearSelection();
    onRefresh();
  }, [selectedDashboards, count, toast, onClearSelection, onRefresh]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag) return;
    selectedDashboards.forEach((d) => {
      const existing = d.tags ?? [];
      if (!existing.includes(tag)) {
        updateDashboard(d._id, { tags: [...existing, tag] });
      }
    });
    toast({
      title: "Тег добавлен",
      description: `Тег «${tag}» добавлен к ${count} дашбордам.`,
    });
    setTagInput("");
    setTagDialogOpen(false);
  }, [tagInput, selectedDashboards, count, updateDashboard, toast]);

  if (count === 0) return null;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-4 left-1/2 z-40 -translate-x-1/2 duration-200">
        <div className="bg-background flex items-center gap-2 rounded-xl border px-3 py-2 shadow-2xl">
          {/* Selection count */}
          <div className="flex items-center gap-2 border-r pr-3 pl-2">
            <CheckSquare className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              Выбрано: <span className="text-amber-600">{count}</span>
            </span>
          </div>

          {/* Action buttons */}
          <Button variant="ghost" size="sm" onClick={handleToggleFavorite} className="gap-1.5">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Избранное</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleDuplicate} className="gap-1.5">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Дублировать</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            className="gap-1.5"
          >
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Тег</span>
          </Button>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Экспорт</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Формат экспорта
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="mr-2 h-4 w-4" />
                JSON (полная структура)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV (только метаданные)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenuSeparator className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="gap-1.5 text-red-600 hover:bg-red-500/10 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Удалить</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-8 w-8"
            title="Снять выделение"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-red-500" />
              Удалить выбранные дашборды?
            </DialogTitle>
            <DialogDescription>
              Вы собираетесь удалить <strong>{count}</strong> дашборд(ов). Это действие необратимо.
              Дашборды будут удалены только из локального состояния и потребуют повторного удаления
              на сервере для полного стирания.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 max-h-32 overflow-auto rounded border p-2">
            {selectedDashboards.map((d) => (
              <div key={d._id} className="flex items-center gap-2 py-0.5 text-xs">
                <span className="h-1 w-1 rounded-full bg-red-500" />
                <span className="truncate">{d.title}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить {count}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-amber-500" />
              Добавить тег
            </DialogTitle>
            <DialogDescription>
              Тег будет добавлен ко всем выбранным дашбордам ({count} шт.), у которых его ещё нет.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
              }}
              placeholder="например: production, monitoring, sla"
              className="bg-background w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {["production", "staging", "monitoring", "alerts", "sla", "team-ops"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagInput(tag)}
                  className="hover:bg-muted rounded-full border px-2 py-0.5 text-xs transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTag} disabled={!tagInput.trim()}>
              <Tag className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Checkbox-style selection cell for dashboard list rows.
 */
interface SelectionCellProps {
  id: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function SelectionCell({ id, selected, onToggle, disabled }: SelectionCellProps) {
  const isChecked = selected.has(id);
  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={isChecked}
        onCheckedChange={() => onToggle(id)}
        disabled={disabled}
        aria-label="Выбрать дашборд"
      />
    </div>
  );
}

/**
 * "Select all" header cell.
 */
interface SelectAllCellProps {
  ids: string[];
  selected: Set<string>;
  onToggleAll: (ids: string[]) => void;
}

export function SelectAllCell({ ids, selected, onToggleAll }: SelectAllCellProps) {
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  return (
    <div className="flex items-center">
      <Checkbox
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={() => onToggleAll(ids)}
        aria-label="Выбрать все"
      />
    </div>
  );
}

/**
 * Compact button shown at the top of the dashboards list that activates
 * selection mode (renders checkboxes on each row).
 */
interface SelectionModeButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
}

export function SelectionModeButton({ active, onClick, count }: SelectionModeButtonProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="gap-1.5"
    >
      <CheckSquare className="h-4 w-4" />
      {active ? `Выбрано: ${count}` : "Выбрать"}
    </Button>
  );
}


