"use client";

import { useState } from "react";
import { useGraphinyaStore, type TimeRange } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Server,
  Shield,
  Globe,
  User,
  Key,
  LogOut,
  RefreshCw,
  Info,
  Copy,
  CheckCircle2,
  Palette,
  Bell,
  Lock,
  Cpu,
  Database,
  Container,
  Activity,
  HardDrive,
  Zap,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { SystemHealthWidget } from "@/components/system-health";

export function SettingsView() {
  const {
    config,
    connectionStatus,
    currentUser,
    tokens,
    isDemoMode,
    logout,
    timeRange,
    setTimeRange,
  } = useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Пароль слишком короткий",
        description: "Минимум 6 символов",
        variant: "destructive",
      });
      return;
    }
    if (isDemoMode) {
      toast({ title: "Недоступно в демо-режиме", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await call({
        path: "/auth/change-password",
        method: "POST",
        body: { oldPassword, newPassword },
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Пароль изменён", description: "Пароль успешно обновлён" });
    } catch {
      toast({
        title: "Ошибка смены пароля",
        description: "Проверьте текущий пароль",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearCache = () => {
    // Clear non-essential localStorage data
    try {
      const store = localStorage.getItem("graphinya-store");
      if (store) {
        const parsed = JSON.parse(store);
        // Keep config and tokens, clear the rest
        localStorage.setItem(
          "graphinya-store",
          JSON.stringify({
            state: {
              config: parsed.state?.config,
              tokens: parsed.state?.tokens,
              isDemoMode: parsed.state?.isDemoMode,
            },
          })
        );
      }
      toast({ title: "Кеш очищен", description: "Локальный кеш приложения очищен" });
    } catch {
      toast({ title: "Ошибка очистки", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Настройки</h2>
        <p className="text-muted-foreground">Конфигурация подключения и параметры системы</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Общие
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Подключение
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Система
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Внешний вид
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Безопасность
          </TabsTrigger>
        </TabsList>

        {/* General tab */}
        <TabsContent value="general" className="space-y-6">
          {/* User info */}
          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-amber-500" />
                  Профиль пользователя
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-white">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{currentUser.username}</h3>
                    <p className="text-muted-foreground text-sm">
                      {currentUser.email || "email не указан"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">{currentUser.role}</Badge>
                      {isDemoMode && (
                        <Badge className="bg-violet-500/10 text-xs text-violet-600">Демо</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                    <span className="text-muted-foreground">ID</span>
                    <code className="bg-muted rounded px-2 py-0.5 text-xs">{currentUser.id}</code>
                  </div>
                  <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                    <span className="text-muted-foreground">Роль</span>
                    <Badge variant="secondary">{currentUser.role}</Badge>
                  </div>
                  <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                    <span className="text-muted-foreground">Статус</span>
                    <Badge className="bg-emerald-500/10 text-xs text-emerald-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Активен
                    </Badge>
                  </div>
                  <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-sm">{currentUser.email || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4 text-amber-500" />
                Управление данными
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Очистить кеш приложения</p>
                  <p className="text-muted-foreground text-xs">
                    Удалить локальный кеш, сохранив настройки подключения
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearCache}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Очистить
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Интервал обновления по умолчанию</p>
                  <p className="text-muted-foreground text-xs">
                    Временной диапазон для новых дашбордов
                  </p>
                </div>
                <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">15 мин</SelectItem>
                    <SelectItem value="1h">1 час</SelectItem>
                    <SelectItem value="6h">6 часов</SelectItem>
                    <SelectItem value="24h">24 часа</SelectItem>
                    <SelectItem value="7d">7 дней</SelectItem>
                    <SelectItem value="30d">30 дней</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Architecture info */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-amber-500" />
                Архитектура Графини
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-foreground flex items-center gap-2 font-semibold">
                    <Container className="h-4 w-4 text-amber-500" />
                    Компоненты системы
                  </h4>
                  <div className="space-y-2">
                    {[
                      {
                        name: "Frontend",
                        desc: "React + Vite + Nginx",
                        port: "80",
                        icon: <Globe className="h-4 w-4 text-blue-500" />,
                      },
                      {
                        name: "Backend API",
                        desc: "Express.js + JWT",
                        port: "5000",
                        icon: <Server className="h-4 w-4 text-emerald-500" />,
                      },
                      {
                        name: "MongoDB",
                        desc: "СУБД для хранения данных",
                        port: "27017",
                        icon: <Database className="h-4 w-4 text-green-500" />,
                      },
                      {
                        name: "Tarantool",
                        desc: "Кеширование дашбордов",
                        port: "3301",
                        icon: <Cpu className="h-4 w-4 text-orange-500" />,
                      },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="bg-background/50 flex items-center gap-3 rounded-lg p-2.5"
                      >
                        {item.icon}
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{item.desc}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          :{item.port}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-foreground flex items-center gap-2 font-semibold">
                    <Zap className="h-4 w-4 text-violet-500" />
                    Плагины (порты)
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: "Prometheus", port: "8080", color: "text-orange-500" },
                      { name: "Пульт / Zabbix", port: "8081", color: "text-blue-500" },
                      { name: "CSV", port: "8082", color: "text-green-500" },
                      { name: "PostgreSQL", port: "8083", color: "text-indigo-500" },
                      { name: "JSON", port: "8084", color: "text-purple-500" },
                      { name: "GitLab", port: "8085", color: "text-red-500" },
                      { name: "Elasticsearch", port: "8086", color: "text-cyan-500" },
                      { name: "ClickHouse", port: "8087", color: "text-yellow-500" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="bg-background/50 flex items-center justify-between rounded-lg p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className={`h-3 w-3 ${item.color}`} />
                          <span className="text-xs">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          :{item.port}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connection tab */}
        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-amber-500" />
                Параметры подключения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Backend API URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted flex-1 truncate rounded-md px-3 py-1.5 text-sm">
                      {config.baseUrl || "—"}
                    </code>
                    {config.baseUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyToClipboard(config.baseUrl, "baseUrl")}
                      >
                        {copiedField === "baseUrl" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Frontend URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted flex-1 truncate rounded-md px-3 py-1.5 text-sm">
                      {config.frontendUrl || "—"}
                    </code>
                    {config.frontendUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyToClipboard(config.frontendUrl, "frontendUrl")}
                      >
                        {copiedField === "frontendUrl" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Badge
                  className={
                    isDemoMode
                      ? "bg-violet-500/10 text-violet-600"
                      : isConnected
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-red-500/10 text-red-600"
                  }
                >
                  {isDemoMode ? "Демо-режим" : isConnected ? "Подключено" : "Не подключено"}
                </Badge>
                {isConnected && (
                  <Button variant="destructive" size="sm" onClick={logout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Отключиться
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* JWT Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-amber-500" />
                Аутентификация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                <span className="text-muted-foreground">Статус JWT</span>
                <Badge variant={tokens?.accessToken ? "secondary" : "outline"}>
                  {tokens?.accessToken ? "Активен" : "Отсутствует"}
                </Badge>
              </div>
              {tokens?.accessToken && (
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                  <span className="text-muted-foreground">Access Token</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted max-w-[200px] truncate rounded px-2 py-0.5 text-xs">
                      {tokens.accessToken.slice(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tokens.accessToken, "token")}
                    >
                      {copiedField === "token" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {tokens?.refreshToken && (
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                  <span className="text-muted-foreground">Refresh Token</span>
                  <code className="bg-muted max-w-[200px] truncate rounded px-2 py-0.5 text-xs">
                    {tokens.refreshToken.slice(0, 20)}...
                  </code>
                </div>
              )}
              <Separator />
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Key className="mt-0.5 h-4 w-4 shrink-0" />
                  По умолчанию: admin / 123456. Система запросит смену пароля при первом входе.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System health tab */}
        <TabsContent value="system" className="space-y-6">
          <SystemHealthWidget />
        </TabsContent>

        {/* Appearance tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-amber-500" />
                Тема оформления
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Светлая", desc: "Классическая светлая тема" },
                  { value: "dark", label: "Тёмная", desc: "Тёмная тема для работы ночью" },
                  { value: "system", label: "Системная", desc: "Автоматически по настройкам ОС" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      theme === t.value
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-border hover:border-amber-500/30"
                    }`}
                  >
                    <div
                      className={`mx-auto mb-2 h-8 w-12 rounded-md ${
                        t.value === "light"
                          ? "border bg-white"
                          : t.value === "dark"
                            ? "border-zinc-700 bg-zinc-900"
                            : "border bg-gradient-to-r from-white to-zinc-900"
                      }`}
                    />
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-muted-foreground text-[10px]">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-amber-500" />
                Уведомления
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Уведомления об ошибках</p>
                  <p className="text-muted-foreground text-xs">Показывать toast при ошибках API</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Индикатор подключения</p>
                  <p className="text-muted-foreground text-xs">
                    Показывать статус подключения в шапке
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-amber-500" />
                Смена пароля
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDemoMode ? (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-violet-600 dark:text-violet-400">
                  Смена пароля недоступна в демо-режиме. Подключитесь к реальному серверу.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Текущий пароль</Label>
                    <Input
                      type="password"
                      placeholder="Введите текущий пароль"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Новый пароль</Label>
                    <Input
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Подтверждение пароля</Label>
                    <Input
                      type="password"
                      placeholder="Повторите новый пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
                    className="bg-amber-500 text-white hover:bg-amber-600"
                  >
                    {changingPassword ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Сменить пароль
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-amber-500" />
                Информация о безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm">
                <p className="font-medium">JWT Аутентификация</p>
                <p className="text-muted-foreground text-xs">
                  Графиня использует JWT (JSON Web Tokens) для аутентификации. Access token
                  используется для авторизации запросов к API, а refresh token позволяет обновить
                  access token без повторного входа. Токены автоматически обновляются через Next.js
                  прокси.
                </p>
              </div>
              <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm">
                <p className="font-medium">CORS Прокси</p>
                <p className="text-muted-foreground text-xs">
                  Все запросы к API Графини проксируются через Next.js серверный маршрут
                  /api/grafinya/proxy для обхода CORS ограничений. Токены и данные не передаются
                  напрямую из браузера к серверу Графини.
                </p>
              </div>
              <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm">
                <p className="font-medium">Хранение данных</p>
                <p className="text-muted-foreground text-xs">
                  Настройки подключения и токены сохраняются в localStorage браузера. Для повышения
                  безопасности используйте HTTPS-подключение к серверу Графини и регулярно меняйте
                  пароль.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
