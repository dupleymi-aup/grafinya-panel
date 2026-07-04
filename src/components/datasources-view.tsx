"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGraphinyaStore } from "@/lib/store";
import { useGraphinyaApi } from "@/hooks/use-grafinya-api";
import { useGraphinyaQuery } from "@/hooks/use-graphinya-query";
import { useTranslation } from "@/hooks/use-translation";
import type { DataSource, DataSourceField } from "@/lib/grafinya-api";
import { DEMO_DATASOURCES } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Plus,
  Search,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Plug,
  RefreshCw,
  Edit3,
  Save,
  Shield,
  Globe,
  FileText,
  Code2,
  GitBranch,
  Search as SearchIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLUGIN_TYPES = [
  {
    value: "prometheus",
    label: "Prometheus / Victoria Metrics",
    icon: <Globe className="h-4 w-4 text-orange-500" />,
    port: 8080,
  },
  {
    value: "pult",
    label: "Пульт / Zabbix",
    icon: <Shield className="h-4 w-4 text-blue-500" />,
    port: 8081,
  },
  {
    value: "postgres",
    label: "PostgreSQL / Postgres Pro",
    icon: <Database className="h-4 w-4 text-indigo-500" />,
    port: 8083,
  },
  {
    value: "clickhouse",
    label: "ClickHouse",
    icon: <Database className="h-4 w-4 text-yellow-500" />,
    port: 8087,
  },
  { value: "csv", label: "CSV", icon: <FileText className="h-4 w-4 text-green-500" />, port: 8082 },
  { value: "json", label: "JSON", icon: <Code2 className="h-4 w-4 text-purple-500" />, port: 8084 },
  {
    value: "elasticsearch",
    label: "Elasticsearch",
    icon: <SearchIcon className="h-4 w-4 text-cyan-500" />,
    port: 8086,
  },
  {
    value: "gitlab",
    label: "GitLab",
    icon: <GitBranch className="h-4 w-4 text-red-500" />,
    port: 8085,
  },
];

const PLUGIN_DEFAULT_FIELDS: Record<string, DataSourceField[]> = {
  prometheus: [
    { code: "url", name: "URL", type: "text", value: "http://prometheus:9090", required: true },
    { code: "timeout", name: "Таймаут (с)", type: "number", value: "30" },
  ],
  pult: [
    { code: "url", name: "URL", type: "text", value: "http://pult:8081", required: true },
    { code: "apiToken", name: "API Token", type: "password", value: "" },
  ],
  postgres: [
    { code: "host", name: "Хост", type: "text", value: "localhost", required: true },
    { code: "port", name: "Порт", type: "number", value: "5432" },
    { code: "database", name: "БД", type: "text", value: "" },
    { code: "username", name: "Пользователь", type: "text", value: "" },
    { code: "password", name: "Пароль", type: "password", value: "" },
  ],
  clickhouse: [
    { code: "url", name: "URL", type: "text", value: "http://clickhouse:8123", required: true },
    { code: "database", name: "БД", type: "text", value: "default" },
  ],
  csv: [
    { code: "filePath", name: "Путь к файлу", type: "text", value: "", required: true },
    { code: "delimiter", name: "Разделитель", type: "text", value: "," },
  ],
  json: [
    { code: "url", name: "URL", type: "text", value: "", required: true },
    { code: "jsonPath", name: "JSONPath", type: "text", value: "$" },
  ],
  elasticsearch: [
    { code: "url", name: "URL", type: "text", value: "http://elastic:9200", required: true },
    { code: "index", name: "Индекс", type: "text", value: "app-logs-*" },
  ],
  gitlab: [
    { code: "url", name: "URL", type: "text", value: "https://gitlab.company.ru", required: true },
    { code: "token", name: "Personal Access Token", type: "password", value: "" },
  ],
};

export function DataSourcesView() {
  const { dataSources, setDataSources, connectionStatus } =
    useGraphinyaStore();
  const { call } = useGraphinyaApi();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingDs, setEditingDs] = useState<DataSource | null>(null);
  const [newName, setNewName] = useState("");
  const [newPlugin, setNewPlugin] = useState("");
  const [newFields, setNewFields] = useState<DataSourceField[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isDefault, setIsDefault] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  const { isLoading } = useGraphinyaQuery<DataSource>({
    queryKey: "datasources",
    apiPath: "/datasources",
    setter: setDataSources,
    demoData: DEMO_DATASOURCES,
  });

  const handleCreate = async () => {
    if (!newName.trim() || !newPlugin) return;
    if (connectionStatus === "demo") {
      const newDs: DataSource = {
        _id: `ds-${Date.now()}`,
        name: newName,
        pluginId: newPlugin,
        pluginName: PLUGIN_TYPES.find((p) => p.value === newPlugin)?.label || newPlugin,
        type: newPlugin,
        fields: newFields,
        isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDataSources([...dataSources, newDs]);
      toast({ title: "Источник данных создан", description: newName });
    } else {
      try {
        await call({
          path: "/datasources",
          method: "POST",
          body: { name: newName, pluginId: newPlugin, fields: newFields, isDefault },
        });
        toast({ title: "Источник данных создан", description: newName });
        queryClient.invalidateQueries({ queryKey: ["datasources"] });
      } catch {
        toast({ title: "Ошибка создания", variant: "destructive" });
      }
    }
    resetForm();
  };

  const handleEdit = (ds: DataSource) => {
    setEditingDs(ds);
    setNewName(ds.name);
    setNewPlugin(ds.pluginId);
    setNewFields(ds.fields || []);
    setIsDefault(ds.isDefault || false);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDs || !newName.trim()) return;
    if (connectionStatus === "demo") {
      setDataSources(
        dataSources.map((ds) =>
          ds._id === editingDs._id
            ? {
                ...ds,
                name: newName,
                fields: newFields,
                isDefault,
                updatedAt: new Date().toISOString(),
              }
            : ds
        )
      );
      toast({ title: "Источник данных обновлён", description: newName });
    } else {
      try {
        await call({
          path: `/datasources/${editingDs._id}`,
          method: "PUT",
          body: { name: newName, fields: newFields, isDefault },
        });
        toast({ title: "Источник данных обновлён", description: newName });
        queryClient.invalidateQueries({ queryKey: ["datasources"] });
      } catch {
        toast({ title: "Ошибка обновления", variant: "destructive" });
      }
    }
    setShowEdit(false);
    setEditingDs(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (connectionStatus === "demo") {
      setDataSources(dataSources.filter((ds) => ds._id !== id));
      toast({ title: "Источник данных удалён" });
      return;
    }
    try {
      await call({ path: `/datasources/${id}`, method: "DELETE" });
      toast({ title: "Источник данных удалён" });
      queryClient.invalidateQueries({ queryKey: ["datasources"] });
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      if (connectionStatus === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        setTestResults((prev) => ({ ...prev, [id]: Math.random() > 0.2 }));
      } else {
        const result = await call<{ status: boolean; message?: string }>({
          path: `/datasources/${id}/test`,
          method: "POST",
        });
        setTestResults((prev) => ({ ...prev, [id]: result.status }));
      }
      toast({
        title: testResults[id] ? "Подключение успешно" : "Ошибка подключения",
        variant: testResults[id] ? "default" : "destructive",
      });
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: false }));
      toast({ title: "Ошибка проверки подключения", variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const handlePluginChange = (pluginId: string) => {
    setNewPlugin(pluginId);
    setNewFields(PLUGIN_DEFAULT_FIELDS[pluginId] || []);
  };

  const handleFieldChange = (index: number, value: string) => {
    setNewFields((prev) => prev.map((f, i) => (i === index ? { ...f, value } : f)));
  };

  const resetForm = () => {
    setShowCreate(false);
    setNewName("");
    setNewPlugin("");
    setNewFields([]);
    setIsDefault(false);
  };

  const filtered = dataSources.filter(
    (ds) =>
      ds.name.toLowerCase().includes(search.toLowerCase()) ||
      ds.pluginId?.toLowerCase().includes(search.toLowerCase())
  );

  const getPluginIcon = (pluginId: string) =>
    PLUGIN_TYPES.find((p) => p.value === pluginId)?.icon || (
      <Database className="h-4 w-4 text-amber-500" />
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("views.datasourcesTitle")}</h2>
          <p className="text-muted-foreground">
            {isConnected
              ? t("views.datasourcesConnected", { count: String(dataSources.length), suffix: dataSources.length === 1 ? "" : dataSources.length < 5 ? "а" : "ов" })
              : t("views.datasourcesSubtitle")}
          </p>
        </div>
        {isConnected && (
          <Button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("views.datasourcesCreate")}
          </Button>
        )}
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Database className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Подключитесь к серверу Графини для управления источниками данных.
          </p>
        </div>
      )}

      {/* Search */}
      {isConnected && (
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Поиск источников данных..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-9 w-9 rounded-lg" />
                  <div>
                    <div className="bg-muted mb-1 h-4 w-24 rounded" />
                    <div className="bg-muted h-3 w-32 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="bg-muted h-3 w-full rounded" />
                  <div className="bg-muted h-3 w-4/5 rounded" />
                  <div className="bg-muted h-3 w-3/5 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data sources grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ds) => {
            const pluginInfo = PLUGIN_TYPES.find((p) => p.value === ds.pluginId);
            return (
              <Card key={ds._id} className="group transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        {getPluginIcon(ds.pluginId)}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">{ds.name}</CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {pluginInfo?.label || ds.pluginId}
                          {pluginInfo && (
                            <span className="text-muted-foreground/60 ml-1">
                              :{pluginInfo.port}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {testResults[ds._id] !== undefined &&
                        (testResults[ds._id] ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleTest(ds._id)}
                        disabled={testing === ds._id}
                        title="Проверить подключение"
                      >
                        {testing === ds._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleEdit(ds)}
                        title="Редактировать"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setDeleteTarget(ds._id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ds.fields?.slice(0, 4).map((field) => (
                      <div key={field.code} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{field.name}</span>
                        <span className="ml-2 max-w-[50%] truncate font-mono">
                          {field.type === "password" && field.value ? "••••••" : field.value || "—"}
                        </span>
                      </div>
                    ))}
                    {ds.fields && ds.fields.length > 4 && (
                      <p className="text-muted-foreground text-[10px]">
                        +{ds.fields.length - 4} полей
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {ds.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          По умолчанию
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                        {new Date(ds.updatedAt).toLocaleDateString("ru-RU")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && isConnected && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plug className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">Источников данных нет</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Создайте первый источник данных для подключения к вашим системам
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            variant="outline"
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать источник
          </Button>
        </div>
      )}

      {/* Supported data source types - always visible when disconnected */}
      {!isConnected && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Поддерживаемые типы источников</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {PLUGIN_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="bg-background/50 flex items-center gap-3 rounded-lg p-3"
                >
                  {type.icon}
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-muted-foreground text-[10px]">Порт :{type.port}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Новый источник данных
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                placeholder="Мой источник данных"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип плагина</Label>
              <Select value={newPlugin} onValueChange={handlePluginChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {PLUGIN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {type.label}
                        <span className="text-muted-foreground text-xs">:{type.port}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Dynamic fields based on plugin type */}
            {newFields.length > 0 && (
              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs">Параметры подключения</Label>
                {newFields.map((field, idx) => (
                  <div key={field.code} className="space-y-1">
                    <Label className="text-xs">
                      {field.name}
                      {field.required && <span className="ml-0.5 text-red-500">*</span>}
                    </Label>
                    <Input
                      type={
                        field.type === "password"
                          ? "password"
                          : field.type === "number"
                            ? "number"
                            : "text"
                      }
                      placeholder={field.placeholder || field.name}
                      value={field.value || ""}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm">
                Использовать по умолчанию
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || !newPlugin}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" />
              Редактировать источник
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Тип плагина</Label>
              <Input
                value={PLUGIN_TYPES.find((p) => p.value === newPlugin)?.label || newPlugin}
                disabled
              />
            </div>
            {newFields.length > 0 && (
              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs">Параметры подключения</Label>
                {newFields.map((field, idx) => (
                  <div key={field.code} className="space-y-1">
                    <Label className="text-xs">
                      {field.name}
                      {field.required && <span className="ml-0.5 text-red-500">*</span>}
                    </Label>
                    <Input
                      type={
                        field.type === "password"
                          ? "password"
                          : field.type === "number"
                            ? "number"
                            : "text"
                      }
                      value={field.value || ""}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="editIsDefault" className="cursor-pointer text-sm">
                Использовать по умолчанию
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!newName.trim()}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить источник данных?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Источник данных будет удалён из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
