"use client";

import { useGraphinyaStore } from "@/lib/store";
import type { Module } from "@/lib/grafinya-api";
import { DEMO_MODULES } from "@/lib/demo-data";
import { useGraphinyaQuery } from "@/hooks/use-graphinya-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Blocks, CheckCircle2, Settings2, LayoutGrid } from "lucide-react";

export function ModulesView() {
  const { modules, setModules, connectionStatus } = useGraphinyaStore();

  const { isLoading } = useGraphinyaQuery<Module>({
    queryKey: "modules",
    apiPath: "/modules",
    setter: setModules,
    demoData: DEMO_MODULES,
  });

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Модули</h2>
        <p className="text-muted-foreground">
          {isConnected
            ? `${modules.length} модул${modules.length === 1 ? "ь" : modules.length < 5 ? "я" : "ей"} подключено`
            : "Расширения платформы с кастомными виджетами"}
        </p>
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Blocks className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Подключитесь к серверу Графини для просмотра установленных модулей.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && isConnected && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* Modules grid */}
      {!isLoading && modules.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modules.map((mod) => (
            <Card key={mod.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 p-2.5">
                      <Blocks className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {mod.title?.find((t) => t.lang === "ru-RU")?.value || mod.name}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{mod.version}
                        </Badge>
                        {mod.isActive ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs text-emerald-500">Активен</span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Неактивен
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {mod.canAddToDashboard && (
                    <Badge className="bg-amber-500/10 text-xs text-amber-600">
                      <LayoutGrid className="mr-1 h-3 w-3" />
                      Дашборд
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mod.description && (
                  <p className="text-muted-foreground text-sm">
                    {mod.description.find((d) => d.lang === "ru-RU")?.value || ""}
                  </p>
                )}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Компоненты</span>
                    <div className="flex gap-1">
                      {mod.components.map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scope</span>
                    <span className="font-mono">{mod.scope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Backend</span>
                    <span className="ml-2 max-w-[60%] truncate font-mono">{mod.baseUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frontend</span>
                    <span className="ml-2 max-w-[60%] truncate font-mono">{mod.frontendHost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Blocks className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Модули не найдены</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Подключите модули через настройки Графини
          </p>
        </div>
      )}

      {/* Module development info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Разработка модулей
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Модули — это расширения платформы Графиня с собственным frontend и backend. Они
            позволяют добавлять кастомные виджеты на дашборды.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground font-medium">Widget</p>
              <p className="mt-1 text-xs">Отображение виджета на дашборде (обязательный)</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground font-medium">WidgetEditor</p>
              <p className="mt-1 text-xs">Редактор настроек виджета (опциональный)</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-foreground font-medium">Settings</p>
              <p className="mt-1 text-xs">Настройки модуля (опциональный)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
