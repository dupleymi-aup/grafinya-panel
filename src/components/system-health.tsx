"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface HealthMetric {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  detail?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

interface ServiceHealth {
  id: string;
  name: string;
  port: number;
  status: "online" | "offline" | "degraded";
  latency: number;
  uptime: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const generateLatency = () => Math.floor(Math.random() * 80) + 20;
const generateCpu = () => Math.floor(Math.random() * 60) + 15;
const generateMemory = () => Math.floor(Math.random() * 40) + 40;

const SERVICES: ServiceHealth[] = [
  {
    id: "backend",
    name: "Backend (Express.js)",
    port: 5000,
    status: "online",
    latency: 18,
    uptime: "14д 6ч 32м",
    description: "REST API, аутентификация, бизнес-логика",
    icon: <Server className="h-4 w-4" />,
    color: "text-emerald-500",
  },
  {
    id: "frontend",
    name: "Frontend (React + Vite)",
    port: 80,
    status: "online",
    latency: 8,
    uptime: "14д 6ч 32м",
    description: "Пользовательский интерфейс",
    icon: <Activity className="h-4 w-4" />,
    color: "text-blue-500",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    port: 27017,
    status: "online",
    latency: 4,
    uptime: "14д 6ч 35м",
    description: "Хранение дашбордов и пользователей",
    icon: <Database className="h-4 w-4" />,
    color: "text-green-500",
  },
  {
    id: "tarantool",
    name: "Tarantool",
    port: 3301,
    status: "online",
    latency: 2,
    uptime: "14д 6ч 35м",
    description: "Кэш сессий и горячих данных",
    icon: <MemoryStick className="h-4 w-4" />,
    color: "text-amber-500",
  },
  {
    id: "prometheus",
    name: "Prometheus Plugin",
    port: 8080,
    status: "online",
    latency: 32,
    uptime: "12д 18ч 04м",
    description: "Плагин мониторинга Prometheus",
    icon: <Activity className="h-4 w-4" />,
    color: "text-orange-500",
  },
  {
    id: "pult",
    name: "Пульт/Zabbix Plugin",
    port: 8081,
    status: "online",
    latency: 24,
    uptime: "12д 18ч 04м",
    description: "Плагин интеграции с Пульт/Zabbix",
    icon: <Activity className="h-4 w-4" />,
    color: "text-purple-500",
  },
  {
    id: "csv",
    name: "CSV Plugin",
    port: 8082,
    status: "online",
    latency: 6,
    uptime: "12д 18ч 04м",
    description: "Импорт данных из CSV-файлов",
    icon: <Activity className="h-4 w-4" />,
    color: "text-cyan-500",
  },
  {
    id: "postgres",
    name: "PostgreSQL Plugin",
    port: 8083,
    status: "degraded",
    latency: 240,
    uptime: "9д 12ч 18м",
    description: "Запросы к PostgreSQL базам данных",
    icon: <Database className="h-4 w-4" />,
    color: "text-blue-500",
  },
  {
    id: "json",
    name: "JSON Plugin",
    port: 8084,
    status: "online",
    latency: 12,
    uptime: "12д 18ч 04м",
    description: "Загрузка данных из JSON API",
    icon: <Activity className="h-4 w-4" />,
    color: "text-yellow-500",
  },
  {
    id: "gitlab",
    name: "GitLab Plugin",
    port: 8085,
    status: "online",
    latency: 86,
    uptime: "11д 03ч 47м",
    description: "Интеграция с GitLab CI/CD",
    icon: <Activity className="h-4 w-4" />,
    color: "text-orange-600",
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch Plugin",
    port: 8086,
    status: "offline",
    latency: 0,
    uptime: "—",
    description: "Поиск и аналитика логов",
    icon: <Database className="h-4 w-4" />,
    color: "text-red-500",
  },
  {
    id: "clickhouse",
    name: "ClickHouse Plugin",
    port: 8087,
    status: "online",
    latency: 18,
    uptime: "10д 22ч 11м",
    description: "Аналитические запросы к ClickHouse",
    icon: <Database className="h-4 w-4" />,
    color: "text-yellow-600",
  },
];

export function SystemHealthWidget({ compact = false }: { compact?: boolean }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [cpu, setCpu] = useState(generateCpu());
  const [memory, setMemory] = useState(generateMemory());
  const [networkIn, setNetworkIn] = useState(Math.floor(Math.random() * 500) + 100);
  const [networkOut, setNetworkOut] = useState(Math.floor(Math.random() * 300) + 50);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(generateCpu());
      setMemory(generateMemory());
      setNetworkIn(Math.floor(Math.random() * 500) + 100);
      setNetworkOut(Math.floor(Math.random() * 300) + 50);
      setLastUpdate(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setCpu(generateCpu());
    setMemory(generateMemory());
    setNetworkIn(Math.floor(Math.random() * 500) + 100);
    setNetworkOut(Math.floor(Math.random() * 300) + 50);
    setLastUpdate(Date.now());
  };

  const stats: HealthMetric[] = [
    {
      id: "cpu",
      name: "CPU (среднее)",
      status: cpu > 80 ? "critical" : cpu > 60 ? "warning" : "healthy",
      value: `${cpu}%`,
      detail: "8 ядер @ 3.2 GHz",
      trend: cpu > 50 ? "up" : "down",
      trendValue: `${Math.abs(cpu - 35)}%`,
    },
    {
      id: "memory",
      name: "Память",
      status: memory > 85 ? "critical" : memory > 70 ? "warning" : "healthy",
      value: `${memory}%`,
      detail: `${(memory * 0.16).toFixed(1)} / 16 ГБ`,
      trend: memory > 60 ? "up" : "stable",
      trendValue: `${Math.abs(memory - 50)}%`,
    },
    {
      id: "disk",
      name: "Диск",
      status: "healthy",
      value: "42%",
      detail: "210 / 500 ГБ",
      trend: "stable",
      trendValue: "0%",
    },
    {
      id: "network",
      name: "Сеть (входящий)",
      status: "healthy",
      value: `${networkIn} МБ/с`,
      detail: `Исходящий: ${networkOut} МБ/с`,
      trend: networkIn > 400 ? "up" : "down",
      trendValue: `${Math.abs(networkIn - 300)} МБ/с`,
    },
  ];

  const onlineCount = SERVICES.filter((s) => s.status === "online").length;
  const degradedCount = SERVICES.filter((s) => s.status === "degraded").length;
  const offlineCount = SERVICES.filter((s) => s.status === "offline").length;
  const overallHealth = Math.round((onlineCount / SERVICES.length) * 100);

  if (compact) {
    return (
      <Card className="border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Системный статус
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {onlineCount}/{SERVICES.length} онлайн
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-emerald-500/5 p-2 text-center">
              <div className="text-lg font-bold text-emerald-500">{onlineCount}</div>
              <div className="text-muted-foreground">Онлайн</div>
            </div>
            <div className="rounded bg-amber-500/5 p-2 text-center">
              <div className="text-lg font-bold text-amber-500">{degradedCount}</div>
              <div className="text-muted-foreground">Деградация</div>
            </div>
            <div className="rounded bg-red-500/5 p-2 text-center">
              <div className="text-lg font-bold text-red-500">{offlineCount}</div>
              <div className="text-muted-foreground">Офлайн</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall status */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                Состояние системы
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Обновлено: {new Date(lastUpdate).toLocaleTimeString("ru-RU")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-500">{overallHealth}%</div>
              <div className="text-muted-foreground text-xs">общая доступность</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallHealth} className="h-2" />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-background rounded p-2 text-center">
              <div className="text-xl font-bold text-emerald-500">{onlineCount}</div>
              <div className="text-muted-foreground text-xs">Онлайн</div>
            </div>
            <div className="bg-background rounded p-2 text-center">
              <div className="text-xl font-bold text-amber-500">{degradedCount}</div>
              <div className="text-muted-foreground text-xs">Деградация</div>
            </div>
            <div className="bg-background rounded p-2 text-center">
              <div className="text-xl font-bold text-red-500">{offlineCount}</div>
              <div className="text-muted-foreground text-xs">Офлайн</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground truncate text-xs">{stat.name}</p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      stat.status === "healthy"
                        ? "text-foreground"
                        : stat.status === "warning"
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    {stat.value}
                  </p>
                  {stat.detail && (
                    <p className="text-muted-foreground mt-0.5 text-[10px]">{stat.detail}</p>
                  )}
                </div>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    stat.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : stat.status === "warning"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {stat.id === "cpu" && <Cpu className="h-4 w-4" />}
                  {stat.id === "memory" && <MemoryStick className="h-4 w-4" />}
                  {stat.id === "disk" && <HardDrive className="h-4 w-4" />}
                  {stat.id === "network" && <Network className="h-4 w-4" />}
                </div>
              </div>
              {stat.trend && stat.trendValue && (
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-amber-500" />
                  ) : stat.trend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Activity className="text-muted-foreground h-3 w-3" />
                  )}
                  <span
                    className={`${
                      stat.trend === "up"
                        ? "text-amber-500"
                        : stat.trend === "down"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stat.trendValue}
                  </span>
                  <span className="text-muted-foreground">за 5 мин</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-amber-500" />
              Сервисы и плагины
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleRefresh}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                className="hover:bg-muted/30 flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <div
                  className={`bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${service.color}`}
                >
                  {service.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{service.name}</span>
                    <Badge variant="outline" className="h-4 shrink-0 px-1 text-[10px]">
                      :{service.port}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {service.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <div className="text-muted-foreground text-xs">Uptime</div>
                    <div className="font-mono text-xs">{service.uptime}</div>
                  </div>
                  <div className="hidden text-right md:block">
                    <div className="text-muted-foreground text-xs">Задержка</div>
                    <div
                      className={`font-mono text-xs ${
                        service.latency > 200
                          ? "text-red-500"
                          : service.latency > 100
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    >
                      {service.latency > 0 ? `${service.latency} мс` : "—"}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${
                      service.status === "online"
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : service.status === "degraded"
                          ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "border-red-500/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {service.status === "online" ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Онлайн
                      </>
                    ) : service.status === "degraded" ? (
                      <>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Деградация
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Офлайн
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
