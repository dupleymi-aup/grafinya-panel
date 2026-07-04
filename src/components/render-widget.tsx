import React from "react";
import type { Widget } from "@/lib/grafinya-api";
import {
  generateTimeSeriesData,
  generatePieData,
  generateTableData,
} from "@/lib/demo-data";
import { CHART_COLORS } from "@/components/dashboard-detail-constants";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type ChartData = ReturnType<typeof generateTimeSeriesData>;
type PieData = ReturnType<typeof generatePieData>;
type TableData = ReturnType<typeof generateTableData>;

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

export function renderWidget(
  widget: Widget,
  idx: number,
  chartData: ChartData,
  pieData: PieData,
  tableData: TableData,
  isFullscreen = false
): React.ReactNode {
  const color = CHART_COLORS[idx % CHART_COLORS.length];
  const color2 = CHART_COLORS[(idx + 1) % CHART_COLORS.length];
  const height = "100%";

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
