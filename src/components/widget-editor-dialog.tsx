"use client";

import { useState } from "react";
import type { Widget, DataSource, WidgetType } from "@/lib/grafinya-api";
import { WIDGET_TYPES } from "@/components/dashboard-detail-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, Save } from "lucide-react";

interface WidgetEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: Widget | null;
  dataSources: DataSource[];
  onSave: (widget: Widget) => void;
  isDemo: boolean;
}

export function WidgetEditorDialog({
  open,
  onOpenChange,
  widget,
  dataSources,
  onSave,
  isDemo,
}: WidgetEditorDialogProps) {
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
