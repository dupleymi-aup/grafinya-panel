"use client";

import { useState, useMemo } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Container,
  Copy,
  Download,
  CheckCircle2,
  Server,
  Database,
  Plug,
  Blocks,
  Globe,
  Shield,
  FileText,
  Code2,
  GitBranch,
  Search,
  Cpu,
  HardDrive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  port: string;
  category: "core" | "plugin" | "database";
  defaultEnabled: boolean;
  required?: boolean;
}

const SERVICES: ServiceOption[] = [
  // Core
  {
    id: "frontend",
    name: "Frontend (React+Vite+Nginx)",
    description: "Веб-интерфейс Графини",
    icon: <Globe className="h-4 w-4" />,
    port: "80",
    category: "core",
    defaultEnabled: true,
    required: true,
  },
  {
    id: "backend",
    name: "Backend API (Express.js)",
    description: "REST API сервер с JWT авторизацией",
    icon: <Server className="h-4 w-4" />,
    port: "5000",
    category: "core",
    defaultEnabled: true,
    required: true,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Основная СУБД для хранения данных",
    icon: <Database className="h-4 w-4" />,
    port: "27017",
    category: "database",
    defaultEnabled: true,
    required: true,
  },
  {
    id: "tarantool",
    name: "Tarantool",
    description: "Кеширование дашбордов и сессий",
    icon: <Cpu className="h-4 w-4" />,
    port: "3301",
    category: "database",
    defaultEnabled: true,
    required: true,
  },
  // Plugins
  {
    id: "prometheus",
    name: "Prometheus Plugin",
    description: "Мониторинг и временные ряды (PromQL)",
    icon: <Container className="h-4 w-4" />,
    port: "8080",
    category: "plugin",
    defaultEnabled: true,
  },
  {
    id: "pult",
    name: "Пульт / Zabbix Plugin",
    description: "Отечественная система мониторинга",
    icon: <Shield className="h-4 w-4" />,
    port: "8081",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "csv",
    name: "CSV Plugin",
    description: "Импорт и визуализация CSV-файлов",
    icon: <FileText className="h-4 w-4" />,
    port: "8082",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "postgres",
    name: "PostgreSQL Plugin",
    description: "SQL-запросы к PostgreSQL и Postgres Pro",
    icon: <Database className="h-4 w-4" />,
    port: "8083",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "json",
    name: "JSON Plugin",
    description: "Подключение к JSON-эндпоинтам",
    icon: <Code2 className="h-4 w-4" />,
    port: "8084",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "gitlab",
    name: "GitLab Plugin",
    description: "Метрики CI/CD и merge requests",
    icon: <GitBranch className="h-4 w-4" />,
    port: "8085",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch Plugin",
    description: "Поиск, агрегации и логи",
    icon: <Search className="h-4 w-4" />,
    port: "8086",
    category: "plugin",
    defaultEnabled: false,
  },
  {
    id: "clickhouse",
    name: "ClickHouse Plugin",
    description: "Аналитические SQL-запросы",
    icon: <HardDrive className="h-4 w-4" />,
    port: "8087",
    category: "plugin",
    defaultEnabled: false,
  },
];

const IMAGE_NAME = "hub.pult.tech/graphinya/graphinya";
const TAGS = ["1.3.0", "1.2.0", "1.1.0", "latest"];

export function ConstructorView() {
  const { connectionStatus } = useGraphinyaStore();
  const { toast } = useToast();
  const [enabledServices, setEnabledServices] = useState<Set<string>>(
    new Set(SERVICES.filter((s) => s.defaultEnabled).map((s) => s.id))
  );
  const [version, setVersion] = useState("1.3.0");
  const [domain, setDomain] = useState("");
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConnected = connectionStatus === "connected" || connectionStatus === "demo";

  const toggleService = (id: string) => {
    const service = SERVICES.find((s) => s.id === id);
    if (service?.required) return;
    setEnabledServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const composeYaml = useMemo(() => {
    const enabled = SERVICES.filter((s) => enabledServices.has(s.id));
    const hasPlugin = enabled.some((s) => s.category === "plugin");

    let yaml = `# docker-compose.yml — Графиня ${version}\n# Сгенерировано конструктором\n\n`;
    yaml += `version: "3.8"\n\n`;
    yaml += `services:\n`;

    // Backend
    if (enabledServices.has("backend")) {
      yaml += `  backend:\n`;
      yaml += `    image: ${IMAGE_NAME}/backend:${version}\n`;
      yaml += `    container_name: graphinya-backend\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    ports:\n`;
      yaml += `      - "5000:5000"\n`;
      yaml += `    environment:\n`;
      yaml += `      - MONGO_URI=mongodb://mongodb:27017/graphinya\n`;
      yaml += `      - TARANTOOL_HOST=tarantool\n`;
      yaml += `      - TARANTOOL_PORT=3301\n`;
      yaml += `      - JWT_SECRET=change-me-in-production\n`;
      yaml += `      - DEFAULT_ADMIN_PASSWORD=123456\n`;
      if (domain) yaml += `      - CORS_ORIGIN=http://${domain}\n`;
      if (smtpEnabled) {
        yaml += `      - SMTP_HOST=smtp.example.com\n`;
        yaml += `      - SMTP_PORT=587\n`;
        yaml += `      - SMTP_USER=\n`;
        yaml += `      - SMTP_PASS=\n`;
      }
      yaml += `    depends_on:\n`;
      yaml += `      - mongodb\n`;
      yaml += `      - tarantool\n`;
      yaml += `\n`;
    }

    // Frontend
    if (enabledServices.has("frontend")) {
      yaml += `  frontend:\n`;
      yaml += `    image: ${IMAGE_NAME}/frontend:${version}\n`;
      yaml += `    container_name: graphinya-frontend\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    ports:\n`;
      yaml += `      - "${domain ? "80:80" : "80:80"}"\n`;
      yaml += `    depends_on:\n`;
      yaml += `      - backend\n`;
      yaml += `\n`;
    }

    // MongoDB
    if (enabledServices.has("mongodb")) {
      yaml += `  mongodb:\n`;
      yaml += `    image: mongo:6\n`;
      yaml += `    container_name: graphinya-mongodb\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    ports:\n`;
      yaml += `      - "27017:27017"\n`;
      yaml += `    volumes:\n`;
      yaml += `      - mongo_data:/data/db\n`;
      yaml += `\n`;
    }

    // Tarantool
    if (enabledServices.has("tarantool")) {
      yaml += `  tarantool:\n`;
      yaml += `    image: tarantool/tarantool:3\n`;
      yaml += `    container_name: graphinya-tarantool\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    ports:\n`;
      yaml += `      - "3301:3301"\n`;
      yaml += `    volumes:\n`;
      yaml += `      - tarantool_data:/var/lib/tarantool\n`;
      yaml += `\n`;
    }

    // Plugins
    const plugins = enabled.filter((s) => s.category === "plugin");
    plugins.forEach((plugin) => {
      yaml += `  ${plugin.id}-plugin:\n`;
      yaml += `    image: ${IMAGE_NAME}/plugin-${plugin.id}:${version}\n`;
      yaml += `    container_name: graphinya-plugin-${plugin.id}\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    ports:\n`;
      yaml += `      - "${plugin.port}:${plugin.port}"\n`;
      yaml += `    depends_on:\n`;
      yaml += `      - backend\n`;
      yaml += `\n`;
    });

    // Volumes
    const volumes: string[] = [];
    if (enabledServices.has("mongodb")) volumes.push("mongo_data:");
    if (enabledServices.has("tarantool")) volumes.push("tarantool_data:");
    if (volumes.length > 0) {
      yaml += `volumes:\n`;
      volumes.forEach((v) => {
        yaml += `  ${v}\n`;
      });
    }

    return yaml;
  }, [enabledServices, version, domain, smtpEnabled]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(composeYaml);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
      return;
    }
    setCopied(true);
    toast({ title: "Скопировано", description: "docker-compose.yml скопирован в буфер обмена" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([composeYaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.yml";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Файл скачан", description: "docker-compose.yml сохранён" });
  };

  const coreServices = SERVICES.filter((s) => s.category === "core");
  const dbServices = SERVICES.filter((s) => s.category === "database");
  const pluginServices = SERVICES.filter((s) => s.category === "plugin");

  const renderServiceCard = (service: ServiceOption) => {
    const enabled = enabledServices.has(service.id);
    return (
      <div
        key={service.id}
        onClick={() => toggleService(service.id)}
        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
          enabled
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border/50 bg-background/50 opacity-60"
        } ${service.required ? "cursor-default" : ""}`}
      >
        <div className={`rounded-md p-1.5 ${enabled ? "text-amber-500" : "text-muted-foreground"}`}>
          {service.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-sm font-medium ${enabled ? "text-foreground" : "text-muted-foreground"}`}
            >
              {service.name}
            </p>
            {service.required && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Обязательный
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">{service.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            :{service.port}
          </Badge>
          <Switch
            checked={enabled}
            disabled={service.required}
            onCheckedChange={() => toggleService(service.id)}
            className="scale-75"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Конструктор</h2>
        <p className="text-muted-foreground">
          Сгенерируйте docker-compose.yml для развёртывания Графини
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Configuration panel */}
        <div className="space-y-4 lg:col-span-1">
          {/* Version & Domain */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Параметры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Версия Графини</Label>
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Домен (необязательно)</Label>
                <Input
                  placeholder="graphinya.company.ru"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="smtp" checked={smtpEnabled} onCheckedChange={setSmtpEnabled} />
                <Label htmlFor="smtp" className="cursor-pointer text-sm">
                  Настроить SMTP
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Core services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Server className="h-3.5 w-3.5 text-amber-500" />
                Ядро системы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {coreServices.map(renderServiceCard)}
              {dbServices.map(renderServiceCard)}
            </CardContent>
          </Card>

          {/* Plugin services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Plug className="h-3.5 w-3.5 text-violet-500" />
                Плагины ({enabledServices.size - coreServices.length - dbServices.length}/
                {pluginServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">{pluginServices.map(renderServiceCard)}</CardContent>
          </Card>
        </div>

        {/* YAML output */}
        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Blocks className="h-3.5 w-3.5 text-emerald-500" />
                  docker-compose.yml
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="mr-1 h-3.5 w-3.5" />
                    )}
                    Копировать
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Скачать
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <pre className="bg-muted/50 max-h-[600px] overflow-auto rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre">
                {composeYaml}
              </pre>
              <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs">
                <span>{SERVICES.filter((s) => enabledServices.has(s.id)).length} сервисов</span>
                <span>Образ: {IMAGE_NAME}</span>
                <span>Тег: {version}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
