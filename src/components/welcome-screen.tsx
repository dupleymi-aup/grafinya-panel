"use client";

import { useGraphinyaStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Sparkles,
  Wifi,
  LayoutDashboard,
  Database,
  Plug,
  Blocks,
  Search,
  Shield,
  BarChart3,
  Clock,
} from "lucide-react";

const FEATURES = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Дашборды",
    desc: "Визуализация данных в реальном времени с виджетами и переменными",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Исследование",
    desc: "Выполнение произвольных запросов к источникам данных",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "8 типов источников",
    desc: "Prometheus, PostgreSQL, ClickHouse, Elasticsearch и другие",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: <Plug className="h-5 w-5" />,
    title: "Плагины",
    desc: "Расширяемая архитектура с контрактом для новых источников",
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: <Blocks className="h-5 w-5" />,
    title: "Модули",
    desc: "Кастомные виджеты и настройки через Module Federation",
    color: "text-cyan-500 bg-cyan-500/10",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "JWT + Refresh",
    desc: "Безопасная аутентификация с автоматическим обновлением токенов",
    color: "text-red-500 bg-red-500/10",
  },
];

const STATS = [
  {
    icon: <BarChart3 className="h-4 w-4 text-amber-500" />,
    label: "5 дашбордов",
    sub: "в демо-режиме",
  },
  { icon: <Database className="h-4 w-4 text-emerald-500" />, label: "6 источников", sub: "данных" },
  { icon: <Plug className="h-4 w-4 text-violet-500" />, label: "8 плагинов", sub: "подключено" },
  {
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    label: "15с — 2мин",
    sub: "интервал обновления",
  },
];

export function WelcomeScreen() {
  const { enableDemoMode } = useGraphinyaStore();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Activity className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Графиня
            </h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-lg">
              Система визуализации и мониторинга данных от{" "}
              <span className="text-foreground font-medium">Лаборатории Числитель</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-12 bg-amber-500 px-8 text-base text-white hover:bg-amber-600"
            onClick={() => {
              // Open connection dialog
              document.querySelector<HTMLElement>("[data-connection-trigger]")?.click();
            }}
          >
            <Wifi className="mr-2 h-5 w-5" />
            Подключиться к серверу
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-violet-500/30 px-8 text-base text-violet-600 hover:bg-violet-500/5"
            onClick={enableDemoMode}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Демо-режим
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="bg-muted/30 border-border/50">
              <CardContent className="flex items-center gap-3 p-3">
                {stat.icon}
                <div>
                  <p className="text-sm font-semibold">{stat.label}</p>
                  <p className="text-muted-foreground text-xs">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 cursor-default transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`rounded-xl p-2 ${feature.color} shrink-0`}>{feature.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick start hint */}
        <div className="text-muted-foreground text-center text-sm">
          <p>
            Нажмите{" "}
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">Alt+D</kbd> для
            быстрого перехода в демо-режим или{" "}
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">?</kbd> для
            горячих клавиш
          </p>
        </div>
      </div>
    </div>
  );
}
