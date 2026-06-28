"use client";

import { useGraphinyaStore } from "@/lib/store";
import { Clock, LayoutDashboard, Database, Trash2 } from "lucide-react";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "сейчас";
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  return `${days}д`;
}

export function RecentItemsList({ compact = false }: { compact?: boolean }) {
  const { recentItems, clearRecentItems, setSelectedDashboardId, setCurrentView } =
    useGraphinyaStore();

  if (recentItems.length === 0) {
    if (compact) return null;
    return (
      <div className="text-muted-foreground px-3 py-2 text-xs">
        <p className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Недавних элементов нет
        </p>
      </div>
    );
  }

  const handleOpen = (item: (typeof recentItems)[number]) => {
    if (item.type === "dashboard") {
      setSelectedDashboardId(item.id);
      setCurrentView("dashboard-detail");
    } else if (item.type === "datasource") {
      setCurrentView("datasources");
    }
  };

  return (
    <div className="px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase">
          <Clock className="h-2.5 w-2.5" />
          Недавние
        </span>
        <button
          onClick={clearRecentItems}
          className="text-muted-foreground hover:text-destructive text-[10px] transition-colors"
          title="Очистить недавние"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {recentItems.slice(0, 5).map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => handleOpen(item)}
            className="hover:bg-muted group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
          >
            {item.type === "dashboard" ? (
              <LayoutDashboard className="h-3 w-3 shrink-0 text-amber-500" />
            ) : (
              <Database className="h-3 w-3 shrink-0 text-blue-500" />
            )}
            <span className="text-muted-foreground group-hover:text-foreground flex-1 truncate transition-colors">
              {item.title}
            </span>
            <span className="text-muted-foreground/70 shrink-0 text-[9px]">
              {formatRelativeTime(item.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
