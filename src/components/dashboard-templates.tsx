"use client";

import { useState } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import type { Dashboard, Widget } from "@/lib/grafinya-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Server,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Users,
  LayoutDashboard,
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Gauge,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WIDGET_TYPE_ICONS: Record<string, React.ReactNode> = {
  line: <LineChart className="h-3 w-3" />,
  bar: <BarChart3 className="h-3 w-3" />,
  area: <Activity className="h-3 w-3" />,
  pie: <PieChart className="h-3 w-3" />,
  table: <Table2 className="h-3 w-3" />,
  gauge: <Gauge className="h-3 w-3" />,
};

// ---- Template definitions ----
interface DashboardTemplate {
  id: string;
  title: string;
  description: string;
  category: "monitoring" | "business" | "infra" | "security";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  widgets: Array<{
    title: string;
    type: Widget["type"];
    cols?: number;
    rows?: number;
    dataSourceId?: string;
    query?: string;
  }>;
  tags: string[];
  refreshTime: number;
}

const TEMPLATES: DashboardTemplate[] = [
  {
    id: "system-overview",
    title: "Обзор системы",
    description: "Базовый мониторинг серверов: CPU, память, диск, сеть, аптайм сервисов",
    category: "monitoring",
    icon: <Server className="h-5 w-5" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    refreshTime: 30000,
    tags: ["мониторинг", "система", "devops"],
    widgets: [
      {
        title: "CPU использование",
        type: "line",
        cols: 2,
        dataSourceId: "prometheus",
        query: 'metric="cpu_usage"',
      },
      {
        title: "Память (RAM)",
        type: "area",
        dataSourceId: "prometheus",
        query: 'metric="memory_usage"',
      },
      { title: "Диск I/O", type: "bar", dataSourceId: "prometheus", query: 'metric="disk_io"' },
      {
        title: "Сетевой трафик",
        type: "line",
        dataSourceId: "prometheus",
        query: 'metric="network_throughput"',
      },
      {
        title: "Статус сервисов",
        type: "table",
        cols: 2,
        dataSourceId: "pult",
        query: "services=running",
      },
      {
        title: "Распределение нагрузки",
        type: "pie",
        dataSourceId: "prometheus",
        query: 'metric="load_distribution"',
      },
    ],
  },
  {
    id: "db-performance",
    title: "Производительность БД",
    description: "Метрики PostgreSQL/ClickHouse: запросы, подключения, медленные запросы, кэш",
    category: "infra",
    icon: <Database className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    refreshTime: 60000,
    tags: ["база данных", "postgres", "clickhouse", "производительность"],
    widgets: [
      {
        title: "Запросов в секунду",
        type: "line",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT count(*) FROM queries WHERE ts > now() - interval '1 min'",
      },
      {
        title: "Активные подключения",
        type: "area",
        dataSourceId: "postgres",
        query: "SELECT count(*) FROM pg_stat_activity",
      },
      {
        title: "Топ медленных запросов",
        type: "table",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10",
      },
      {
        title: "Hit ratio кэша",
        type: "gauge",
        dataSourceId: "postgres",
        query: "SELECT sum(blks_hit) / sum(blks_hit + blks_read) FROM pg_stat_database",
      },
      {
        title: "Размер таблиц",
        type: "bar",
        dataSourceId: "postgres",
        query:
          "SELECT relname, pg_total_relation_size(relid) FROM pg_statio_user_tables ORDER BY 2 DESC LIMIT 5",
      },
    ],
  },
  {
    id: "alerts-overview",
    title: "Алерты и инциденты",
    description: "Активные инциденты, алерты по сервисам, история инцидентов, MTTR",
    category: "monitoring",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    refreshTime: 15000,
    tags: ["алерты", "инциденты", "monitoring"],
    widgets: [
      {
        title: "Активные инциденты",
        type: "table",
        cols: 2,
        dataSourceId: "pult",
        query: "status=active",
      },
      {
        title: "Алерты за 24ч",
        type: "bar",
        dataSourceId: "prometheus",
        query: 'metric="alerts_24h"',
      },
      { title: "По критичности", type: "pie", dataSourceId: "pult", query: "group=criticality" },
      {
        title: "MTTR (среднее время восстановления)",
        type: "line",
        dataSourceId: "pult",
        query: "metric=mttr",
      },
      {
        title: "Топ проблемных сервисов",
        type: "table",
        dataSourceId: "pult",
        query: "top=problematic",
      },
    ],
  },
  {
    id: "api-metrics",
    title: "API метрики",
    description: "Запросы, latency, ошибки, статус-коды, эндпоинты с высокой нагрузкой",
    category: "monitoring",
    icon: <Activity className="h-5 w-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    refreshTime: 30000,
    tags: ["api", "latency", "http"],
    widgets: [
      {
        title: "RPS по эндпоинтам",
        type: "line",
        cols: 2,
        dataSourceId: "prometheus",
        query: 'metric="http_requests_total"',
      },
      {
        title: "Latency p50/p95/p99",
        type: "area",
        cols: 2,
        dataSourceId: "prometheus",
        query: 'metric="http_request_duration"',
      },
      {
        title: "Статус-коды",
        type: "pie",
        dataSourceId: "prometheus",
        query: 'metric="http_status_codes"',
      },
      {
        title: "Топ медленных эндпоинтов",
        type: "table",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT endpoint, avg_duration FROM api_stats ORDER BY avg_duration DESC LIMIT 10",
      },
      {
        title: "Ошибки 5xx",
        type: "bar",
        dataSourceId: "prometheus",
        query: 'metric="http_5xx_errors"',
      },
    ],
  },
  {
    id: "infra-health",
    title: "Здоровье инфраструктуры",
    description: "Статус контейнеров, узлов Kubernetes, доступность сервисов, емкость",
    category: "infra",
    icon: <Gauge className="h-5 w-5" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    refreshTime: 30000,
    tags: ["k8s", "docker", "инфраструктура"],
    widgets: [
      {
        title: "Статус подов",
        type: "table",
        cols: 2,
        dataSourceId: "prometheus",
        query: 'metric="kube_pod_status"',
      },
      {
        title: "Утилизация узлов",
        type: "bar",
        dataSourceId: "prometheus",
        query: 'metric="node_utilization"',
      },
      {
        title: "Память по неймспейсам",
        type: "pie",
        dataSourceId: "prometheus",
        query: 'metric="kube_memory_usage"',
      },
      {
        title: "Сетевой I/O",
        type: "line",
        cols: 2,
        dataSourceId: "prometheus",
        query: 'metric="container_network_io"',
      },
      {
        title: "CPU по контейнерам",
        type: "bar",
        dataSourceId: "prometheus",
        query: 'metric="container_cpu"',
      },
    ],
  },
  {
    id: "security-audit",
    title: "Аудит безопасности",
    description:
      "Входы в систему, подозрительные действия, изменения прав, заблокированные попытки",
    category: "security",
    icon: <Zap className="h-5 w-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    refreshTime: 60000,
    tags: ["безопасность", "аудит", "логи"],
    widgets: [
      {
        title: "Входы за 24ч",
        type: "line",
        cols: 2,
        dataSourceId: "elasticsearch",
        query: '{"query":{"match":{"event":"login"}}}',
      },
      {
        title: "Заблокированные попытки",
        type: "bar",
        dataSourceId: "elasticsearch",
        query: '{"query":{"match":{"event":"login_failed"}}}',
      },
      {
        title: "Активные сессии",
        type: "table",
        cols: 2,
        dataSourceId: "pult",
        query: "sessions=active",
      },
      {
        title: "По странам",
        type: "pie",
        dataSourceId: "elasticsearch",
        query: '{"aggs":{"countries":{"terms":{"field":"geo.country"}}}}',
      },
      {
        title: "Изменения прав",
        type: "table",
        dataSourceId: "pult",
        query: "events=permission_change",
      },
    ],
  },
  {
    id: "business-kpi",
    title: "Бизнес KPI",
    description: "Ключевые метрики бизнеса: выручка, конверсия, активные пользователи, заказы",
    category: "business",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    refreshTime: 300000,
    tags: ["business", "kpi", "выручка"],
    widgets: [
      {
        title: "Выручка за период",
        type: "line",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT date_trunc('day', created_at), sum(amount) FROM orders GROUP BY 1",
      },
      {
        title: "Конверсия воронки",
        type: "bar",
        dataSourceId: "postgres",
        query: "SELECT stage, count(*) FROM funnel GROUP BY stage",
      },
      {
        title: "Каналы привлечения",
        type: "pie",
        dataSourceId: "postgres",
        query: "SELECT channel, count(*) FROM users GROUP BY channel",
      },
      {
        title: "Топ продуктов",
        type: "table",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT product, sum(qty) FROM order_items GROUP BY 1 ORDER BY 2 DESC LIMIT 10",
      },
      {
        title: "ARPU",
        type: "area",
        dataSourceId: "postgres",
        query:
          "SELECT date_trunc('week', created_at), sum(amount)/count(distinct user_id) FROM orders GROUP BY 1",
      },
    ],
  },
  {
    id: "user-activity",
    title: "Активность пользователей",
    description: "DAU/MAU, сессии, retention, поведенческие метрики",
    category: "business",
    icon: <Users className="h-5 w-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    refreshTime: 300000,
    tags: ["users", "analytics", "retention"],
    widgets: [
      {
        title: "DAU/MAU",
        type: "line",
        cols: 2,
        dataSourceId: "clickhouse",
        query: "SELECT toDate(event_time), uniqExact(user_id) FROM events GROUP BY 1",
      },
      {
        title: "Retention по когортам",
        type: "table",
        cols: 2,
        dataSourceId: "clickhouse",
        query: "SELECT cohort, day, retention FROM retention_table",
      },
      {
        title: "Сессии по времени суток",
        type: "bar",
        dataSourceId: "clickhouse",
        query: "SELECT toHour(event_time), count() FROM sessions GROUP BY 1",
      },
      {
        title: "Устройства",
        type: "pie",
        dataSourceId: "clickhouse",
        query: "SELECT device_type, count() FROM sessions GROUP BY 1",
      },
      {
        title: "Топ страниц",
        type: "table",
        dataSourceId: "clickhouse",
        query: "SELECT path, count() FROM page_views GROUP BY 1 ORDER BY 2 DESC LIMIT 10",
      },
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce аналитика",
    description: "Заказы, средний чек, брошенные корзины, топ товаров, выручка по категориям",
    category: "business",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    refreshTime: 120000,
    tags: ["ecommerce", "заказы", "выручка"],
    widgets: [
      {
        title: "Заказы за день",
        type: "line",
        cols: 2,
        dataSourceId: "postgres",
        query: "SELECT date_trunc('day', created_at), count(*) FROM orders GROUP BY 1",
      },
      {
        title: "Средний чек",
        type: "area",
        dataSourceId: "postgres",
        query: "SELECT date_trunc('day', created_at), avg(total) FROM orders GROUP BY 1",
      },
      {
        title: "Брошенные корзины",
        type: "bar",
        dataSourceId: "postgres",
        query: "SELECT date_trunc('day', created_at), count(*) FROM abandoned_carts GROUP BY 1",
      },
      {
        title: "Топ категорий",
        type: "pie",
        dataSourceId: "postgres",
        query: "SELECT category, sum(amount) FROM order_items GROUP BY 1",
      },
      {
        title: "Топ товаров",
        type: "table",
        cols: 2,
        dataSourceId: "postgres",
        query:
          "SELECT product_name, sum(qty), sum(amount) FROM order_items GROUP BY 1 ORDER BY 3 DESC LIMIT 10",
      },
    ],
  },
];

const categoryLabels: Record<DashboardTemplate["category"], string> = {
  monitoring: "Мониторинг",
  business: "Бизнес",
  infra: "Инфраструктура",
  security: "Безопасность",
};

const categoryColors: Record<DashboardTemplate["category"], string> = {
  monitoring: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  business: "border-violet-500/30 text-violet-600 dark:text-violet-400",
  infra: "border-blue-500/30 text-blue-600 dark:text-blue-400",
  security: "border-amber-500/30 text-amber-600 dark:text-amber-400",
};

interface DashboardTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardTemplates({ open, onOpenChange }: DashboardTemplatesProps) {
  const {
    dashboards,
    setDashboards,
    isDemoMode,
    setSelectedDashboardId,
    setCurrentView,
    logActivity,
    addRecentItem,
  } = useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [activeCategory, setActiveCategory] = useState<DashboardTemplate["category"] | "all">(
    "all"
  );

  const filteredTemplates =
    activeCategory === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleApplyTemplate = async (template: DashboardTemplate) => {
    const title = customTitle.trim() || template.title;
    const widgets: Widget[] = template.widgets.map((w, idx) => ({
      id: `w-${Date.now()}-${idx}`,
      title: w.title,
      type: w.type,
      cols: w.cols || 1,
      rows: w.rows || 2,
      dataSourceId: w.dataSourceId,
      query: w.query,
    }));

    const newDashboard: Dashboard = {
      _id: `dash-${Date.now()}`,
      title,
      description: template.description,
      tags: template.tags,
      isFavorite: false,
      createdBy: isDemoMode ? "demo" : "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      widgets,
      variables: [],
      refreshTime: template.refreshTime,
    };

    if (isDemoMode) {
      setDashboards([...dashboards, newDashboard]);
    } else {
      try {
        await call({
          path: "/dashboards",
          method: "POST",
          body: {
            title,
            description: template.description,
            tags: template.tags,
            widgets,
            refreshTime: template.refreshTime,
          },
        });
      } catch {
        toast({
          title: "Ошибка",
          description: "Не удалось создать дашборд из шаблона",
          variant: "destructive",
        });
        return;
      }
    }

    logActivity({
      action: "Создан дашборд из шаблона",
      category: "dashboard",
      details: `Шаблон: ${template.title}`,
      targetId: newDashboard._id,
      targetType: "dashboard",
    });

    addRecentItem({
      id: newDashboard._id,
      type: "dashboard",
      title: newDashboard.title,
    });

    toast({
      title: "Дашборд создан",
      description: `Создан дашборд «${title}» с ${widgets.length} виджетами`,
    });

    setSelectedDashboardId(newDashboard._id);
    setCurrentView("dashboard-detail");
    onOpenChange(false);
    setCustomTitle("");
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-amber-500" />
            Шаблоны дашбордов
          </DialogTitle>
          <DialogDescription>
            Выберите готовый шаблон, чтобы быстро создать дашборд с преднастроенными виджетами
          </DialogDescription>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={activeCategory === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveCategory("all")}
          >
            Все ({TEMPLATES.length})
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = TEMPLATES.filter((t) => t.category === key).length;
            return (
              <Button
                key={key}
                variant={activeCategory === key ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveCategory(key as DashboardTemplate["category"])}
              >
                {label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Templates grid */}
        <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-md ${
                selectedTemplate?.id === template.id ? "ring-2 ring-amber-500" : ""
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${template.bgColor} ${template.color} flex shrink-0 items-center justify-center`}
                  >
                    {template.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm">{template.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-[9px] ${categoryColors[template.category]}`}
                    >
                      {categoryLabels[template.category]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground line-clamp-2 text-xs">{template.description}</p>

                {/* Widget types */}
                <div className="flex flex-wrap items-center gap-1">
                  {template.widgets.slice(0, 6).map((w, idx) => (
                    <span
                      key={idx}
                      className="bg-muted text-muted-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                      title={w.title}
                    >
                      {WIDGET_TYPE_ICONS[w.type] || <BarChart3 className="h-3 w-3" />}
                      {w.type}
                    </span>
                  ))}
                  {template.widgets.length > 6 && (
                    <span className="text-muted-foreground text-[10px]">
                      +{template.widgets.length - 6}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="py-0 text-[9px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected template details */}
        {selectedTemplate && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Название дашборда:</Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={selectedTemplate.title}
                className="h-8 flex-1 text-sm"
              />
            </div>
            <div className="text-muted-foreground text-xs">
              Будет создано виджетов:{" "}
              <strong className="text-foreground">{selectedTemplate.widgets.length}</strong>
              {" • "}
              Авто-обновление:{" "}
              <strong className="text-foreground">
                {(selectedTemplate.refreshTime / 1000).toFixed(0)}с
              </strong>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => selectedTemplate && handleApplyTemplate(selectedTemplate)}
            disabled={!selectedTemplate}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            Создать из шаблона
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
