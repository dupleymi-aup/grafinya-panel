"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Widget } from "@/lib/grafinya-api";
import type {
  generateTimeSeriesData,
  generatePieData,
  generateTableData,
} from "@/lib/demo-data";
import { WIDGET_ICONS } from "@/components/dashboard-detail-constants";
import { renderWidget } from "@/components/render-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Maximize2, Edit3, Trash2, BarChart3, Table2 } from "lucide-react";

type ChartData = ReturnType<typeof generateTimeSeriesData>;
type PieData = ReturnType<typeof generatePieData>;
type TableData = ReturnType<typeof generateTableData>;

interface SortableWidgetCardProps {
  widget: Widget;
  idx: number;
  isWide: boolean;
  isConnected: boolean;
  editMode: boolean;
  chartData: ChartData;
  pieData: PieData;
  tableData: TableData;
  onEdit: (widget: Widget) => void;
  onDelete: (id: string) => void;
  onFullscreen: (widget: Widget) => void;
}

export function SortableWidgetCard({
  widget,
  idx,
  isWide,
  isConnected,
  editMode,
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
            <div className="h-44">
              {renderWidget(widget, idx, chartData, pieData, tableData)}
            </div>
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
