"use client";

import { useGraphinyaStore } from "@/lib/store";
import type { Plugin } from "@/lib/grafinya-api";
import { DEMO_PLUGINS } from "@/lib/demo-data";
import { useGraphinyaQuery } from "@/hooks/use-graphinya-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plug,
  CheckCircle2,
  Activity,
  Server,
  Database,
  FileJson,
  FileSpreadsheet,
  Search,
  GitBranch,
} from "lucide-react";

const PLUGIN_ICONS: Record<string, React.ReactNode> = {
  prometheus: <Activity className="h-5 w-5" />,
  pult: <Server className="h-5 w-5" />,
  postgres: <Database className="h-5 w-5" />,
  clickhouse: <Database className="h-5 w-5" />,
  csv: <FileSpreadsheet className="h-5 w-5" />,
  json: <FileJson className="h-5 w-5" />,
  elasticsearch: <Search className="h-5 w-5" />,
  gitlab: <GitBranch className="h-5 w-5" />,
};

const PLUGIN_COLORS: Record<string, string> = {
  prometheus: "bg-orange-500/10 text-orange-500",
  pult: "bg-red-500/10 text-red-500",
  postgres: "bg-blue-500/10 text-blue-500",
  clickhouse: "bg-yellow-500/10 text-yellow-600",
  csv: "bg-emerald-500/10 text-emerald-500",
  json: "bg-violet-500/10 text-violet-500",
  elasticsearch: "bg-cyan-500/10 text-cyan-500",
  gitlab: "bg-orange-600/10 text-orange-600",
};

export function PluginsView() {
  const { plugins, setPlugins, connectionStatus } =
    useGraphinyaStore();

  const { isLoading } = useGraphinyaQuery<Plugin>({
    queryKey: "plugins",
    apiPath: "/plugins",
    setter: setPlugins,
    demoData: DEMO_PLUGINS,
  });

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Плагины</h2>
        <p className="text-muted-foreground">
          {isConnected
            ? `${plugins.length} плагин${plugins.length === 1 ? "" : plugins.length < 5 ? "а" : "ов"} подключено`
            : "Подключите источники данных через плагины"}
        </p>
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Plug className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Подключитесь к серверу Графини для просмотра установленных плагинов.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {/* Plugins grid */}
      {!isLoading && plugins.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => {
            const name = plugin.name?.toLowerCase() || "";
            const icon = PLUGIN_ICONS[name] || <Plug className="h-5 w-5" />;
            const colorClass = PLUGIN_COLORS[name] || "bg-amber-500/10 text-amber-500";

            return (
              <Card key={plugin._id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold">
                        {plugin.title || plugin.name}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{plugin.version || "—"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs text-emerald-500">Активен</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {plugin.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {plugin.description}
                    </p>
                  )}
                  {plugin.baseUrl && (
                    <div className="text-muted-foreground mt-3 truncate font-mono text-xs">
                      {plugin.baseUrl}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && plugins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plug className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Плагины не найдены</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Убедитесь, что плагины настроены в docker-compose.yml
          </p>
        </div>
      )}

      {/* Supported plugins info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Поддерживаемые плагины</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { name: "Prometheus", desc: "Мониторинг и временные ряды" },
              { name: "Пульт / Zabbix", desc: "Система мониторинга" },
              { name: "PostgreSQL", desc: "SQL-запросы к БД" },
              { name: "ClickHouse", desc: "Аналитические запросы" },
              { name: "CSV", desc: "Импорт CSV-файлов" },
              { name: "JSON", desc: "JSON-эндпоинты" },
              { name: "Elasticsearch", desc: "Поиск и агрегации" },
              { name: "GitLab", desc: "Метрики и CI/CD" },
            ].map((p) => (
              <div key={p.name} className="bg-background/50 flex items-center gap-2 rounded-lg p-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
