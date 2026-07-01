"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useGraphinyaStore } from "@/lib/store";
import type { AppView } from "@/lib/store";
import {
  LayoutDashboard,
  Database,
  Plug,
  Blocks,
  Settings,
  Search,
  Container,
  Activity,
  Sparkles,
  Zap,
  Moon,
  Sun,
  HelpCircle,
  RefreshCw,
  History,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group: string;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const {
    dashboards,
    dataSources,
    plugins,
    isDemoMode,
    enableDemoMode,
    logout,
    setCurrentView,
    setSelectedDashboardId,
  } = useGraphinyaStore();
  const { theme, setTheme } = useTheme();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const go = (view: AppView) => {
    setCurrentView(view);
    setOpen(false);
  };

  const actions: CommandAction[] = [
    // Navigation
    {
      id: "nav-dashboards",
      label: "Дашборды",
      icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: "Alt+1",
      action: () => go("dashboards"),
      group: "Навигация",
      keywords: "dashboards dashboard главная",
    },
    {
      id: "nav-explorer",
      label: "Исследование данных",
      icon: <Search className="h-4 w-4" />,
      shortcut: "Alt+2",
      action: () => go("explorer"),
      group: "Навигация",
      keywords: "explorer query запросы",
    },
    {
      id: "nav-datasources",
      label: "Источники данных",
      icon: <Database className="h-4 w-4" />,
      shortcut: "Alt+3",
      action: () => go("datasources"),
      group: "Навигация",
      keywords: "datasources postgres clickhouse prometheus",
    },
    {
      id: "nav-plugins",
      label: "Плагины",
      icon: <Plug className="h-4 w-4" />,
      shortcut: "Alt+4",
      action: () => go("plugins"),
      group: "Навигация",
      keywords: "plugins плагины",
    },
    {
      id: "nav-modules",
      label: "Модули",
      icon: <Blocks className="h-4 w-4" />,
      shortcut: "Alt+5",
      action: () => go("modules"),
      group: "Навигация",
      keywords: "modules модули",
    },
    {
      id: "nav-constructor",
      label: "Конструктор docker-compose",
      icon: <Container className="h-4 w-4" />,
      shortcut: "Alt+7",
      action: () => go("constructor"),
      group: "Навигация",
      keywords: "constructor docker compose",
    },
    {
      id: "nav-activity",
      label: "Журнал активности",
      icon: <History className="h-4 w-4" />,
      shortcut: "Alt+8",
      action: () => go("activity"),
      group: "Навигация",
      keywords: "activity log журнал активность история",
    },
    {
      id: "nav-settings",
      label: "Настройки",
      icon: <Settings className="h-4 w-4" />,
      shortcut: "Alt+6",
      action: () => go("settings"),
      group: "Навигация",
      keywords: "settings настройки",
    },
  ];

  // Dashboard quick-access
  const dashboardActions: CommandAction[] = dashboards.slice(0, 8).map((d) => ({
    id: `dash-${d._id}`,
    label: d.title,
    hint: d.description?.slice(0, 60),
    icon: <Activity className="h-4 w-4 text-amber-500" />,
    action: () => {
      setSelectedDashboardId(d._id);
      setCurrentView("dashboard-detail");
      setOpen(false);
    },
    group: "Дашборды",
    keywords: d.title,
  }));

  // Data source quick-access
  const dataSourceActions: CommandAction[] = dataSources.slice(0, 6).map((ds) => ({
    id: `ds-${ds._id}`,
    label: ds.name,
    hint: ds.type?.toUpperCase(),
    icon: <Database className="h-4 w-4 text-blue-500" />,
    action: () => {
      setCurrentView("datasources");
      setOpen(false);
    },
    group: "Источники данных",
    keywords: ds.name,
  }));

  // Plugin quick-access
  const pluginActions: CommandAction[] = plugins.slice(0, 8).map((p) => ({
    id: `pl-${p._id}`,
    label: p.title || p.name,
    hint: p.status,
    icon: <Plug className="h-4 w-4 text-emerald-500" />,
    action: () => {
      setCurrentView("plugins");
      setOpen(false);
    },
    group: "Плагины",
    keywords: p.title || p.name,
  }));

  // Quick actions
  const quickActions: CommandAction[] = [
    !isDemoMode
      ? {
          id: "qa-demo",
          label: "Включить демо-режим",
          icon: <Sparkles className="h-4 w-4 text-violet-500" />,
          shortcut: "Alt+D",
          action: () => {
            enableDemoMode();
            setOpen(false);
          },
          group: "Быстрые действия",
        }
      : {
          id: "qa-logout",
          label: "Отключиться",
          icon: <Zap className="h-4 w-4 text-amber-500" />,
          action: () => {
            logout();
            setOpen(false);
          },
          group: "Быстрые действия",
        },
    {
      id: "qa-theme",
      label: theme === "dark" ? "Светлая тема" : "Тёмная тема",
      icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        setOpen(false);
      },
      group: "Быстрые действия",
    },
    {
      id: "qa-refresh",
      label: "Обновить данные",
      icon: <RefreshCw className="h-4 w-4" />,
      shortcut: "F5",
      action: () => {
        window.location.reload();
        setOpen(false);
      },
      group: "Быстрые действия",
    },
  ];

  const allActions = [
    ...actions,
    ...dashboardActions,
    ...dataSourceActions,
    ...pluginActions,
    ...quickActions,
  ];

  // Group actions
  const grouped = allActions.reduce<Record<string, CommandAction[]>>((acc, action) => {
    if (!acc[action.group]) acc[action.group] = [];
    acc[action.group].push(action);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск по Графине..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено.</CommandEmpty>
        {Object.entries(grouped).map(([group, groupActions]) => {
          if (groupActions.length === 0) return null;
          return (
            <div key={group}>
              <CommandGroup heading={group}>
                {groupActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.hint || ""} ${action.keywords || ""}`}
                    onSelect={() => action.action()}
                  >
                    {action.icon}
                    <div className="flex flex-1 flex-col">
                      <span>{action.label}</span>
                      {action.hint && (
                        <span className="text-muted-foreground text-xs">{action.hint}</span>
                      )}
                    </div>
                    {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </div>
          );
        })}
        <CommandGroup heading="Справка">
          <CommandItem
            value="документация docs help помощь"
            onSelect={() => {
              window.open("https://docs.pult.tech/constructor", "_blank");
              setOpen(false);
            }}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Открыть документацию</span>
            <CommandShortcut>docs.pult.tech</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
