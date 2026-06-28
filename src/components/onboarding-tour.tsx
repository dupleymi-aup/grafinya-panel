"use client";

import { useState, useEffect } from "react";
import { useGraphinyaStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  LayoutDashboard,
  Search,
  Database,
  Bell,
  Keyboard,
  Command,
  Moon,
  CheckCircle2,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Добро пожаловать в Графиню!",
    description:
      "Это панель управления для работы с системой визуализации и мониторинга данных Графиня. Давайте кратко рассмотрим основные возможности — это займёт меньше минуты.",
    icon: <Sparkles className="h-8 w-8 text-amber-500" />,
  },
  {
    id: "dashboards",
    title: "Дашборды",
    description:
      "Создавайте и просматривайте интерактивные дашборды с виджетами — линейными графиками, столбчатыми диаграммами, круговыми диаграммами и таблицами. Виджеты можно перетаскивать, редактировать и разворачивать на весь экран.",
    icon: <LayoutDashboard className="h-8 w-8 text-amber-500" />,
    highlight: "Раздел «Дашборды» в боковой панели",
  },
  {
    id: "explorer",
    title: "Исследование данных",
    description:
      "Запрашивайте данные напрямую из источников. Сохраняйте часто используемые запросы, просматривайте результаты в виде графика, таблицы или JSON, экспортируйте в CSV.",
    icon: <Search className="h-8 w-8 text-amber-500" />,
    highlight: "Раздел «Исследование»",
  },
  {
    id: "datasources",
    title: "Источники данных",
    description:
      "Подключайте различные источники данных через 8 типов плагинов: Prometheus, Пульт/Zabbix, CSV, PostgreSQL, JSON, GitLab, Elasticsearch, ClickHouse. Каждый источник можно проверить и настроить.",
    icon: <Database className="h-8 w-8 text-amber-500" />,
    highlight: "Раздел «Источники данных»",
  },
  {
    id: "command",
    title: "Командная палитра (Ctrl+K)",
    description:
      "Быстрый поиск и навигация по всему приложению. Нажмите Ctrl+K (или Cmd+K на Mac), чтобы найти дашборд, источник или плагин, переключить тему или открыть документацию.",
    icon: <Command className="h-8 w-8 text-amber-500" />,
    highlight: "Кнопка с ⌘K в правом верхнем углу",
  },
  {
    id: "notifications",
    title: "Уведомления",
    description:
      "Следите за событиями системы — новые подключения, изменения статусов сервисов, обновления плагинов. Кнопка с колокольчиком показывает счётчик непрочитанных уведомлений.",
    icon: <Bell className="h-8 w-8 text-amber-500" />,
    highlight: "Кнопка с колокольчиком в шапке",
  },
  {
    id: "shortcuts",
    title: "Горячие клавиши",
    description:
      "Используйте Alt+1-8 для быстрого переключения между разделами, Alt+D для демо-режима, ? для подсказки по горячим клавишам, Esc для закрытия диалогов.",
    icon: <Keyboard className="h-8 w-8 text-amber-500" />,
    highlight: "Кнопка с иконкой клавиатуры",
  },
  {
    id: "theme",
    title: "Тёмная тема",
    description:
      "Переключайте между светлой и тёмной темой одним кликом. Выбор сохраняется автоматически.",
    icon: <Moon className="h-8 w-8 text-amber-500" />,
    highlight: "Кнопка с иконкой солнца/луны",
  },
  {
    id: "demo",
    title: "Демо-режим",
    description:
      "Не подключены к Графине? Включите демо-режим (Alt+D), чтобы увидеть все возможности приложения с реалистичными демонстрационными данными.",
    icon: <Sparkles className="h-8 w-8 text-violet-500" />,
    highlight: "Меню подключения в правом верхнем углу",
  },
  {
    id: "ready",
    title: "Готово к работе!",
    description:
      "Вы ознакомились с основными возможностями. Подключитесь к Графине или включите демо-режим, чтобы начать. Подробная справка всегда доступна по кнопке с вопросительным знаком.",
    icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
  },
];

export function OnboardingTour() {
  const { onboardingCompleted, completeOnboarding, enableDemoMode, logActivity } =
    useGraphinyaStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show tour for first-time users (after a short delay)
    if (!onboardingCompleted) {
      const hasSeenTour = localStorage.getItem("grafinya-tour-seen");
      if (!hasSeenTour) {
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem("grafinya-tour-seen", "1");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [onboardingCompleted]);

  const handleFinish = () => {
    completeOnboarding();
    logActivity({
      action: "Завершён онбординг",
      category: "system",
      details: "Пользователь прошёл краткий тур по приложению",
    });
    setOpen(false);
  };

  const handleSkip = () => {
    completeOnboarding();
    setOpen(false);
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleSkip();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                {currentStep.icon}
              </div>
              <div>
                <DialogTitle className="text-lg">{currentStep.title}</DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Шаг {step + 1} из {TOUR_STEPS.length}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-2 -mr-2 h-7 w-7"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">{currentStep.description}</p>

          {currentStep.highlight && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Где найти:</strong> {currentStep.highlight}
              </p>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step
                    ? "w-6 bg-amber-500"
                    : idx < step
                      ? "w-1.5 bg-amber-500/50"
                      : "bg-muted-foreground/30 w-1.5"
                }`}
                aria-label={`Шаг ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground text-xs"
          >
            Пропустить тур
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            )}
            {isLast ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    enableDemoMode();
                    handleFinish();
                  }}
                >
                  <Sparkles className="mr-1 h-4 w-4 text-violet-500" />В демо-режим
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinish}
                  className="bg-amber-500 text-white hover:bg-amber-600"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Начать работу
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                Далее
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
