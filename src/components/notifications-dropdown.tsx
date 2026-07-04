"use client";

import { useState, useMemo } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { useTranslation } from "@/hooks/use-translation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  Check,
  Trash2,
} from "lucide-react";

export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationCategory =
  "system" | "datasource" | "dashboard" | "plugin" | "module" | "security";

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    url?: string;
  };
}

// Generate some demo notifications
function generateDemoNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: "n1",
      type: "success",
      category: "system",
      title: "Система запущена",
      message:
        "Графиня успешно инициализирована. Все базовые компоненты работают в штатном режиме.",
      timestamp: now - 5 * 60 * 1000,
      read: false,
    },
    {
      id: "n2",
      type: "info",
      category: "datasource",
      title: "Новый источник данных",
      message: "Подключён источник данных «Prometheus (prod)» на порту 8080. Доступно 23 метрики.",
      timestamp: now - 30 * 60 * 1000,
      read: false,
      action: { label: "Открыть", url: "datasources" },
    },
    {
      id: "n3",
      type: "warning",
      category: "datasource",
      title: "Высокая задержка ответа",
      message:
        "Источник «PostgreSQL analytics» отвечает медленнее обычного (p95 = 1.2с). Рекомендуем проверить индексы.",
      timestamp: now - 2 * 60 * 60 * 1000,
      read: false,
      action: { label: "Диагностика", url: "datasources" },
    },
    {
      id: "n4",
      type: "info",
      category: "plugin",
      title: "Плагин обновлён",
      message: "Плагин CSV-импорта обновлён до версии 1.4.2. Добавлена поддержка gzip-архивов.",
      timestamp: now - 6 * 60 * 60 * 1000,
      read: true,
    },
    {
      id: "n5",
      type: "error",
      category: "datasource",
      title: "Соединение разорвано",
      message: "Elasticsearch logs временно недоступен. Повторная попытка через 30 секунд.",
      timestamp: now - 8 * 60 * 60 * 1000,
      read: true,
      action: { label: "Переподключить", url: "datasources" },
    },
    {
      id: "n6",
      type: "success",
      category: "dashboard",
      title: "Дашборд опубликован",
      message: "Дашборд «Производительность БД» успешно опубликован и доступен команде.",
      timestamp: now - 24 * 60 * 60 * 1000,
      read: true,
      action: { label: "Открыть", url: "dashboards" },
    },
    {
      id: "n7",
      type: "info",
      category: "security",
      title: "Новый вход в систему",
      message: "Зафиксирован вход под учётной записью admin с IP 192.168.1.42 (Москва).",
      timestamp: now - 36 * 60 * 60 * 1000,
      read: true,
    },
  ];
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  info: { icon: <Info className="h-4 w-4" />, color: "text-blue-500", bg: "bg-blue-500/10" },
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  error: { icon: <AlertCircle className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-500/10" },
};

const categoryLabels: Record<NotificationCategory, string> = {
  system: "Система",
  datasource: "Источник данных",
  dashboard: "Дашборд",
  plugin: "Плагин",
  module: "Модуль",
  security: "Безопасность",
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export function NotificationsDropdown() {
  const { setCurrentView } = useGraphinyaStore();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    generateDemoNotifications()
  );
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleShowAll = () => {
    setOpen(false);
    setCurrentView("activity");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="Уведомления">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Уведомления</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                {unreadCount} новых
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <Check className="mr-1 h-3 w-3" />
                Прочитать
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 text-xs hover:text-red-500"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Bell className="text-muted-foreground/40 mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">Нет уведомлений</p>
              <p className="text-muted-foreground/70 mt-1 text-xs">Новые события появятся здесь</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const cfg = typeConfig[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`group hover:bg-muted/50 relative cursor-pointer p-3 transition-colors ${
                      !notification.read ? "bg-amber-500/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`h-8 w-8 rounded-full ${cfg.bg} flex shrink-0 items-center justify-center ${cfg.color}`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground line-clamp-1 text-sm font-medium">
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="h-4 px-1 text-[9px]">
                            {categoryLabels[notification.category]}
                          </Badge>
                          <span className="text-muted-foreground text-[10px]">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="h-8 w-full text-xs" onClick={handleShowAll}>
                {t("nav.activity")}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
