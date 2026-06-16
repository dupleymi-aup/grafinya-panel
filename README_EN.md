<div align="center">

# Grafinya — Control Panel

### Full-featured Next.js panel for the Grafinya monitoring and data visualization platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Organization:** Laboratory Chislitel

**Intellectual Property:** Dupley Maxim Igorevich

</div>

---

## About the Project

**Grafinya — Control Panel** is a full-featured Next.js application for interacting with the **Grafinya** monitoring and data visualization platform by Laboratory Chislitel. The panel provides an intuitive interface for managing dashboards, exploring data, configuring data sources, and monitoring infrastructure.

The project is developed as a standalone frontend that communicates with the Grafinya backend via REST API. The panel includes **8 main views**, a command palette, a demo mode for serverless operation, a presentation mode for NOC/SOC displays, dashboard templates, bulk actions, and **8 color palettes**.

Full documentation is available in Russian and English:
- [README на русском языке](README_RU.md)
- [README in English](README_EN.md)

### Key Features

- **8 main views** — dashboards, explorer, datasources, plugins, modules, constructor, activity, settings
- **Dashboards** — list and detail view with widgets (Line, Bar, Pie, Table, Area, Gauge), drag-and-drop reordering
- **Explorer** — query editor, history, saved queries, charts/tables/JSON
- **Command palette** (Ctrl+K) — global search and navigation
- **Demo mode** — fully functional operation without a server connection
- **Presentation mode** — fullscreen mode for NOC/SOC displays with auto-rotation and auto-refresh
- **Dashboard templates** — 9 ready-made templates across 4 categories
- **8 color palettes** — Amber, Ocean, Sunset, Forest, Monochrome, Contrast, Pastel, Traffic Light
- **Bulk actions** — batch export, duplication, tagging, and deletion
- **Change history** — auto-snapshots of dashboard state with version restoration
- **Query metrics** — execution time, response size, and cache hit tracking
- **System monitoring** — live status of 12 services with CPU, memory, disk, and network

### Platform Views

| # | View | Description |
|---|------|-------------|
| 1 | **Dashboards** | Manage dashboards with widgets, variables, and auto-refresh |
| 2 | **Explorer** | Interactive query editor with result visualization |
| 3 | **Datasources** | CRUD operations, health checks, plugin-specific fields |
| 4 | **Plugins** | Overview of 8 plugin types (Prometheus, Pult, CSV, PostgreSQL, etc.) |
| 5 | **Modules** | Installed modules list and component registry |
| 6 | **Constructor** | docker-compose.yml generator with configurable services |
| 7 | **Activity** | User action log with category filters |
| 8 | **Settings** | General, connection, system, appearance, security |

### Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router and Server Components |
| **TypeScript** | 5 | Static typing |
| **React** | 19 | User interface library |
| **Tailwind CSS** | 4 | Utility-first CSS |
| **shadcn/ui** | — | UI components |
| **Zustand** | 5 | State management with persist middleware |
| **Recharts** | — | Data visualization |
| **Prisma** | 6 | ORM for database access |
| **Framer Motion** | 12 | Animations and transitions |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dupleymi-aup/grafinya-panel.git
cd grafinya-panel

# Install dependencies
bun install

# Run in development mode
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Roadmap

- [x] Dashboards with widgets and drag-and-drop
- [x] Explorer with query editor
- [x] Datasources (CRUD)
- [x] Plugins (8 types)
- [x] Modules and component registry
- [x] docker-compose constructor
- [x] Command palette (Ctrl+K)
- [x] Demo mode
- [x] Dark/light theme
- [x] System monitoring
- [x] Presentation mode
- [x] Dashboard change history
- [x] Bulk actions
- [x] Dashboard templates
- [x] 8 color palettes
- [x] Onboarding tour
- [ ] Real-time notifications
- [ ] Dashboard PDF export

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**Grafinya** — © 2025-2026 Dupley Maxim Igorevich / Laboratory Chislitel

</div>
