"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import { DEMO_DATASOURCES, generateTimeSeriesData } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Loader2,
  Code2,
  Table2,
  BarChart3,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  TrendingUp,
  Activity,
  Save,
  Trash2,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import {
  LineChart,
  Line,
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
import { useToast } from "@/hooks/use-toast";
import { exportCSV, exportJSON } from "@/lib/export-utils";
import {
  CHART_PALETTES,
  getPaletteById,
  loadPreferredPaletteId,
  savePreferredPaletteId,
} from "@/lib/chart-palettes";
import { QueryMetricsBar, useQueryMetrics } from "@/components/query-metrics";
import { Palette as PaletteIcon } from "lucide-react";

const CHART_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

// eslint helper to keep CHART_COLORS used (legacy fallback)
void CHART_COLORS;

const DEMO_QUERIES = [
  {
    label: "CPU метрики",
    query: 'metric="cpu_usage"',
    type: "prometheus",
    icon: "📈",
  },
  {
    label: "SQL запрос",
    query: "SELECT time, value FROM metrics WHERE metric = 'requests' LIMIT 50",
    type: "postgres",
    icon: "🗃️",
  },
  {
    label: "ClickHouse аналитика",
    query: "SELECT toStartOfHour(timestamp) as h, count() as cnt FROM events GROUP BY h ORDER BY h DESC LIMIT 24",
    type: "clickhouse",
    icon: "📊",
  },
  {
    label: "Elasticsearch агрегация",
    query: '{"aggs":{"by_level":{"terms":{"field":"level"}}}}',
    type: "elasticsearch",
    icon: "🔍",
  },
  {
    label: "GitLab pipelines",
    query: '{"project":"grafinya-frontend","scope":"finished"}',
    type: "gitlab",
    icon: "🦊",
  },
];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  dataSourceId: string;
  createdAt: string;
}

export function ExplorerView() {
  const { connectionStatus, dataSources, isDemoMode, setDataSources } = useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  const [selectedDs, setSelectedDs] = useState<string>("");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [resultTab, setResultTab] = useState("chart");
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [paletteId, setPaletteId] = useState<string>("amber");
  const { metrics, isRunning: metricsRunning, runWithMetrics } = useQueryMetrics();

  const chartData = useMemo(() => generateTimeSeriesData(20), []);

  // Load preferred palette id on mount
  useEffect(() => {
    const stored = loadPreferredPaletteId();
    if (stored) setPaletteId(stored);
  }, []);

  const activePalette = useMemo(() => getPaletteById(paletteId), [paletteId]);

  const handlePaletteChange = useCallback((id: string) => {
    setPaletteId(id);
    savePreferredPaletteId(id);
    toast({ title: "Палитра изменена", description: getPaletteById(id).name });
  }, [toast]);

  // Load data sources in demo mode
  const activeDataSources = useMemo(() => {
    if (connectionStatus === "demo") {
      return dataSources.length > 0 ? dataSources : DEMO_DATASOURCES;
    }
    return dataSources;
  }, [connectionStatus, dataSources]);

  const handleRun = async () => {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    setResultTab("chart");
    setHistory((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 20));

    try {
      const payload = await runWithMetrics(async () => {
        if (connectionStatus === "demo") {
          await new Promise((r) => setTimeout(r, 600));
          return {
            status: 200,
            frames: [
              {
                refID: "A",
                fields: [
                  {
                    name: "Результат запроса",
                    refID: "A",
                    values: chartData.slice(0, 12).map((d) => ({
                      time: d.time,
                      value: d.cpu,
                      memory: d.memory,
                      requests: d.requests,
                      errors: d.errors,
                    })),
                  },
                ],
              },
            ],
          };
        } else if (connectionStatus === "connected" && selectedDs) {
          return await call({
            path: "/query",
            method: "POST",
            body: {
              dataSourceId: selectedDs,
              queries: [
                {
                  refID: "A",
                  maxDataPoints: 100,
                  timeRange: { from: Date.now() / 1000 - 3600, to: Date.now() / 1000 },
                  json: query,
                },
              ],
            },
          });
        }
        return null;
      });
      if (payload) {
        setResult(payload);
        toast({ title: "Запрос выполнен", description: "Результаты получены успешно" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка выполнения запроса");
      toast({ title: "Ошибка запроса", description: "Не удалось выполнить запрос", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Скопировано в буфер обмена" });
  };

  const handleSaveQuery = () => {
    if (!saveName.trim()) return;
    const saved: SavedQuery = {
      id: `sq-${Date.now()}`,
      name: saveName,
      query,
      dataSourceId: selectedDs,
      createdAt: new Date().toISOString(),
    };
    setSavedQueries((prev) => [saved, ...prev]);
    setShowSaveDialog(false);
    setSaveName("");
    toast({ title: "Запрос сохранён", description: saveName });
  };

  const handleDeleteSaved = (id: string) => {
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
    toast({ title: "Запрос удалён" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Исследование данных</h2>
        <p className="text-muted-foreground">
          Выполняйте запросы к источникам данных и визуализируйте результаты
        </p>
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Подключитесь к серверу или включите демо-режим для выполнения запросов.
          </p>
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Query panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-amber-500" />
                  Запрос
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Data source selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Источник данных</Label>
                  <Select value={selectedDs} onValueChange={setSelectedDs}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите источник" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDataSources.map((ds) => (
                        <SelectItem key={ds._id} value={ds._id}>
                          {ds.name} ({ds.pluginId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Query editor */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Запрос</Label>
                  <Textarea
                    placeholder='Введите запрос... Например: metric="cpu_usage"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="font-mono text-sm min-h-[120px] resize-y"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        handleRun();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Ctrl+Enter для выполнения
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => query && setShowSaveDialog(true)}
                        disabled={!query.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRun}
                    disabled={running || (!selectedDs && !isDemoMode) || !query.trim()}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Выполнить
                  </Button>
                  <Button variant="outline" onClick={() => { setQuery(""); setResult(null); setError(null); }} size="sm">
                    Очистить
                  </Button>
                </div>

                {/* Quick queries */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Быстрые запросы</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_QUERIES.map((q) => (
                      <Button
                        key={q.label}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setQuery(q.query)}
                      >
                        <span className="mr-1">{q.icon}</span>
                        {q.label}
                        <Badge variant="secondary" className="text-[8px] ml-1.5 px-1">
                          {q.type}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {(result || error) && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {error ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      Результат
                      {result && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          200 OK
                        </Badge>
                      )}
                    </CardTitle>
                    {/* Chart type selector + palette + export */}
                    {result && !error && (
                      <div className="flex gap-1 items-center flex-wrap">
                        <div className="flex gap-1">
                          {(["area", "line", "bar"] as const).map((ct) => (
                            <Button
                              key={ct}
                              variant={chartType === ct ? "secondary" : "ghost"}
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setChartType(ct)}
                            >
                              {ct === "area" ? <Activity className="h-3 w-3" /> : ct === "line" ? <TrendingUp className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
                            </Button>
                          ))}
                        </div>
                        <div className="h-4 w-px bg-border mx-1" />
                        {/* Palette selector */}
                        <Select value={paletteId} onValueChange={handlePaletteChange}>
                          <SelectTrigger className="h-6 w-[110px] text-[10px] px-2 py-0 gap-1">
                            <PaletteIcon className="h-3 w-3" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHART_PALETTES.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-0.5">
                                    {p.colors.slice(0, 4).map((c) => (
                                      <div key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
                                    ))}
                                  </div>
                                  <span>{p.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => {
                            const rows = chartData.slice(0, 12).map((d) => ({ ...d }));
                            exportCSV(rows, "grafinya-query-result");
                            toast({ title: "Экспорт выполнен", description: "Данные сохранены в CSV" });
                          }}
                          title="Экспорт в CSV"
                        >
                          <FileSpreadsheet className="h-3 w-3 mr-1" />
                          CSV
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => {
                            exportJSON(result, "grafinya-query-result");
                            toast({ title: "Экспорт выполнен", description: "Данные сохранены в JSON" });
                          }}
                          title="Экспорт в JSON"
                        >
                          <FileJson className="h-3 w-3 mr-1" />
                          JSON
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-4 rounded-lg">
                      {error}
                    </div>
                  ) : (
                    <>
                    {/* Query metrics bar */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b">
                      <QueryMetricsBar metrics={metrics} isRunning={metricsRunning} />
                      {result && (
                        <Badge variant="secondary" className="text-xs">
                          200 OK
                        </Badge>
                      )}
                    </div>
                    <Tabs value={resultTab} onValueChange={setResultTab}>
                      <TabsList className="mb-3">
                        <TabsTrigger value="chart" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          График
                        </TabsTrigger>
                        <TabsTrigger value="table" className="text-xs">
                          <Table2 className="h-3 w-3 mr-1" />
                          Таблица
                        </TabsTrigger>
                        <TabsTrigger value="json" className="text-xs">
                          <Code2 className="h-3 w-3 mr-1" />
                          JSON
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="chart">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === "area" ? (
                              <AreaChart data={chartData.slice(0, 12)}>
                                <defs>
                                  <linearGradient id="explorerGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activePalette.colors[0]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={activePalette.colors[0]} stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="explorerGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activePalette.colors[1]} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={activePalette.colors[1]} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Area type="monotone" dataKey="cpu" stroke={activePalette.colors[0]} fill="url(#explorerGrad)" strokeWidth={2} name="CPU %" />
                                <Area type="monotone" dataKey="memory" stroke={activePalette.colors[1]} fill="url(#explorerGrad2)" strokeWidth={2} name="Memory %" />
                              </AreaChart>
                            ) : chartType === "line" ? (
                              <LineChart data={chartData.slice(0, 12)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Line type="monotone" dataKey="cpu" stroke={activePalette.colors[0]} strokeWidth={2} dot={{ r: 3 }} name="CPU %" />
                                <Line type="monotone" dataKey="memory" stroke={activePalette.colors[1]} strokeWidth={2} dot={{ r: 3 }} name="Memory %" />
                              </LineChart>
                            ) : (
                              <BarChart data={chartData.slice(0, 12)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                <Bar dataKey="cpu" fill={activePalette.colors[0]} radius={[3, 3, 0, 0]} name="CPU %" />
                                <Bar dataKey="memory" fill={activePalette.colors[1]} radius={[3, 3, 0, 0]} name="Memory %" />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      <TabsContent value="table">
                        <div className="max-h-72 overflow-auto rounded-lg border">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                <th className="p-2 text-left font-medium">Время</th>
                                <th className="p-2 text-right font-medium">CPU %</th>
                                <th className="p-2 text-right font-medium">Memory %</th>
                                <th className="p-2 text-right font-medium">Запросы</th>
                                <th className="p-2 text-right font-medium">Ошибки</th>
                                <th className="p-2 text-right font-medium">Latency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {chartData.slice(0, 12).map((row, i) => (
                                <tr key={i} className="border-t hover:bg-muted/30">
                                  <td className="p-2 font-mono">{row.time}</td>
                                  <td className="p-2 text-right font-mono">
                                    <span className={row.cpu > 70 ? "text-red-500" : row.cpu > 50 ? "text-amber-500" : ""}>
                                      {row.cpu.toFixed(1)}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right font-mono">
                                    <span className={row.memory > 80 ? "text-red-500" : row.memory > 60 ? "text-amber-500" : ""}>
                                      {row.memory.toFixed(1)}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right font-mono">{row.requests}</td>
                                  <td className="p-2 text-right font-mono">
                                    <span className={row.errors > 10 ? "text-red-500" : row.errors > 5 ? "text-amber-500" : ""}>
                                      {row.errors}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right font-mono">{row.latency}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      <TabsContent value="json">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => handleCopy(JSON.stringify(result, null, 2))}
                          >
                            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-auto max-h-72">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - History & Saved & Info */}
          <div className="space-y-4">
            {/* Saved queries */}
            {savedQueries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Save className="h-4 w-4 text-amber-500" />
                    Сохранённые
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedQueries.map((sq) => (
                      <div key={sq.id} className="flex items-center gap-2">
                        <button
                          onClick={() => { setQuery(sq.query); setSelectedDs(sq.dataSourceId); }}
                          className="flex-1 text-left p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs truncate cursor-pointer transition-colors"
                        >
                          <span className="font-medium">{sq.name}</span>
                          <span className="text-muted-foreground ml-1 font-mono text-[10px]">({sq.query.slice(0, 20)}...)</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground"
                          onClick={() => handleDeleteSaved(sq.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Query history */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-500" />
                  История запросов
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(q)}
                        className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-mono truncate cursor-pointer transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Запросы пока не выполнялись
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Plugin endpoints reference */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-amber-500" />
                  API плагинов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { method: "GET", path: "/well-known", desc: "Метаданные" },
                  { method: "POST", path: "/datasource/health-check", desc: "Проверка связи" },
                  { method: "POST", path: "/datasource/constructor-fields", desc: "Поля конфигурации" },
                  { method: "POST", path: "/query/constructor-fields", desc: "Поля запроса" },
                  { method: "POST", path: "/query/get-result", desc: "Выполнение запроса" },
                  { method: "POST", path: "/variable/values", desc: "Значения переменных" },
                ].map((ep) => (
                  <div key={ep.path} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[8px] px-1 font-mono ${
                        ep.method === "GET"
                          ? "text-emerald-600 border-emerald-500/30"
                          : "text-blue-600 border-blue-500/30"
                      }`}
                    >
                      {ep.method}
                    </Badge>
                    <code className="font-mono flex-1 truncate">{ep.path}</code>
                    <span className="text-muted-foreground shrink-0">{ep.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Query execution format */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-amber-500" />
                  Формат запроса
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 rounded-lg p-3 text-[10px] font-mono overflow-auto">
{`POST /api/v1/query
{
  "dataSourceId": "string",
  "queries": [{
    "refID": "A",
    "maxDataPoints": 100,
    "timeRange": {
      "from": 1718000000,
      "to": 1718003600
    },
    "json": "query string"
  }],
  "variables": {}
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Сохранить запрос</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название запроса"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveQuery()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSaveQuery}
              disabled={!saveName.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
