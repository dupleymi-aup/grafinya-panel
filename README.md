<div align="center">

# Графиня — Панель управления

**Grafinya — Control Panel**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Автор / Author:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

**Организация / Organization:** Лаборатория Числитель / Laboratory Chislitel

**Интеллектуальная собственность / Intellectual Property:** Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>

---

## О проекте / About the Project

**Графиня — Панель управления** — полнофункциональное Next.js приложение для работы с платформой мониторинга и визуализации данных **Графиня** от Лаборатории Числитель. Панель предоставляет интуитивный интерфейс для управления дашбордами, исследований данных, настройки источников данных и мониторинга инфраструктуры.

**Grafinya — Control Panel** is a full-featured Next.js application for interacting with the **Grafinya** monitoring and data visualization platform by Laboratory Chislitel. The panel provides an intuitive interface for managing dashboards, exploring data, configuring data sources, and monitoring infrastructure.

Полные описания / Full documentation:
- [README на русском языке](README_RU.md)
- [README in English](README_EN.md)

### Ключевые возможности / Key Features

- **8 основных видов / 8 main views** — дашборды, explorer, источники данных, плагины, модули, конструктор, активность, настройки
- **Дашборды / Dashboards** — виджеты (Line, Bar, Pie, Table, Area, Gauge), drag-and-drop переупорядочивание
- **Explorer** — редактор запросов, история, сохранённые запросы, графики/таблицы/JSON
- **Командная палитра / Command palette** (Ctrl+K) — глобальный поиск и навигация
- **Демо-режим / Demo mode** — работа без подключения к серверу
- **Режим презентации / Presentation mode** — полноэкранный режим для NOC/SOC-дисплеев
- **Шаблоны дашбордов / Dashboard templates** — 9 готовых шаблонов в 4 категориях
- **8 цветовых палитр / 8 color palettes** — Янтарь, Океан, Закат, Лес, Монохром, Контраст, Пастель, Светофор
- **Массовые действия / Bulk actions** — пакетный экспорт, дублирование, тегирование, удаление
- **История изменений / Change history** — авто-снимки состояния дашборда с восстановлением
- **Мониторинг системы / System monitoring** — live-статус 12 сервисов

### Технологии / Technologies

| Технология | Назначение / Purpose |
|------------|----------------------|
| **Next.js 16** | React-фреймворк с App Router / React framework with App Router |
| **TypeScript 5** | Статическая типизация / Static typing |
| **React 19** | Библиотека UI / User interface library |
| **Tailwind CSS 4** | Утилитарные CSS-стили / Utility-first CSS |
| **shadcn/ui** | Компоненты интерфейса / UI components |
| **Zustand 5** | Управление состоянием / State management |
| **Recharts** | Визуализация данных / Data visualization |
| **Prisma 6** | ORM для базы данных / Database ORM |
| **Framer Motion 12** | Анимации / Animations |

### Быстрый старт / Quick Start

```bash
# Клонировать репозиторий / Clone the repository
git clone https://github.com/dupleymi-aup/grafinya-panel.git
cd grafinya-panel

# Установить зависимости / Install dependencies
bun install

# Запустить в режиме разработки / Run in development mode
bun run dev
```

Приложение будет доступно по адресу / Application available at [http://localhost:3000](http://localhost:3000)

### Дорожная карта / Roadmap

- [x] Дашборды с виджетами и drag-and-drop / Dashboards with widgets and drag-and-drop
- [x] Explorer с редактором запросов / Explorer with query editor
- [x] Источники данных / Datasources
- [x] Плагины (8 типов) / Plugins (8 types)
- [x] Модули и реестр компонентов / Modules and component registry
- [x] Конструктор docker-compose / docker-compose constructor
- [x] Командная палитра / Command palette (Ctrl+K)
- [x] Демо-режим / Demo mode
- [x] Тёмная/светлая тема / Dark/light theme
- [x] Мониторинг системы / System monitoring
- [x] Режим презентации / Presentation mode
- [x] История изменений / Change history
- [x] Массовые действия / Bulk actions
- [x] Шаблоны дашбордов / Dashboard templates
- [x] 8 цветовых палитр / 8 color palettes
- [x] Онбординг-тур / Onboarding tour

---

## Автор / Author

**Дуплей Максим Игоревич / Dupley Maxim Igorevich**

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича. Все права на программный код, дизайн, контент и учебные материалы принадлежат автору.

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## Лицензия / License

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича (Dupley Maxim Igorevich). Условия использования описаны в файле [LICENSE](./LICENSE).

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**Графиня / Grafinya** — © 2025-2026 Дуплей Максим Игоревич / Dupley Maxim Igorevich

</div>
