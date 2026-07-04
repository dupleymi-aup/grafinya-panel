import React from "react";
import type { WidgetType } from "@/lib/grafinya-api";
import { TrendingUp, BarChart3, Activity, Table2 } from "lucide-react";

export const CHART_COLORS = [
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

export const WIDGET_TYPES: { value: WidgetType; label: string; icon: React.ReactNode }[] = [
  { value: "line", label: "Линейный график", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "area", label: "Area график", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "bar", label: "Столбчатая диаграмма", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "pie", label: "Круговая диаграмма", icon: <Activity className="h-4 w-4" /> },
  { value: "table", label: "Таблица", icon: <Table2 className="h-4 w-4" /> },
  { value: "gauge", label: "Индикатор", icon: <Activity className="h-4 w-4" /> },
];

export const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  line: <TrendingUp className="h-3.5 w-3.5" />,
  area: <TrendingUp className="h-3.5 w-3.5" />,
  bar: <BarChart3 className="h-3.5 w-3.5" />,
  pie: <Activity className="h-3.5 w-3.5" />,
  table: <Table2 className="h-3.5 w-3.5" />,
  gauge: <Activity className="h-3.5 w-3.5" />,
};
