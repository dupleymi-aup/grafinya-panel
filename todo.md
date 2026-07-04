# TODO — Графиня Панель управления

Список улучшений и доработок для проекта, составленный по результатам анализа кодовой базы.

---

## Критичные замечания / Critical Issues

### Безопасность
- [x] **Удалить `.env` из репозитория** — файл содержит `DATABASE_URL` с реальным путём, добавить в `.gitignore`
- [x] **Убрать `ignoreBuildErrors: true`** в `next.config.ts:7` — скрывает ошибки типизации при сборке
- [x] **Включить `reactStrictMode: true`** в `next.config.ts:9` — сейчас отключён, что маскирует потенциальные баги
- [x] **Включить `noImplicitAny: true`** в `tsconfig.json:14` — сейчас `false`, что снижает качество типизации
- [x] **Валидация на серверном прокси** — Zod-схема для валидации baseUrl, path, method
- [x] **Прокси проверяет Content-Type ответа** — возвращает 502 для не-JSON ответов
- [ ] **Access token передаётся в теле POST-запроса** через прокси — лучше через заголовки Cookie/HttpOnly

### База данных
- [x] **Prisma schema не использовался** — удалён вместе с `db.ts` и зависимостями
- [x] **`db/custom.db` закоммичен** — убран из отслеживания git

---

## Функционал / Features

### Новые возможности
- [ ] **WebSocket для реалтайма** — текущий мониторинг системы poll'ится, нет push-уведомлений об изменениях
- [ ] **Уведомления в реальном времени** — упомянуто в README, но не реализовано
- [x] **Экспорт дашбордов в PDF** — jspdf + html2canvas, кнопка PDF в шапке дашборда
- [x] **Мультиязычность (i18n)** — useTranslation hook, LanguageSwitcher, messages/ru.json + en.json
- [x] **Импорт/экспорт дашбордов** — экспорт в JSON + импорт из JSON-файла
- [ ] **Версионирование API** — прокси привязан к `/api/v1`, нет поддержки нескольких версий API

### Улучшения существующего
- [ ] **Dashboard drag-and-drop** — `@dnd-kit` установлен, но grid-раскладка виджетов не использует resize (только reorder)
- [ ] **Автоподстановка переменных** — переменные дашборда не подставляются в запросы виджетов автоматически
- [x] **Кэширование запросов** — React Query: useQuery в dashboards, datasources, plugins, modules
- [x] **Оффлайн-режим** — PWA манифест + Service Worker для кэширования статики

---

## Качество кода / Code Quality

### Архитектура
- [x] **page.tsx монолит** — разделён на AppHeader, AppSidebar, MobileSidebar, ShortcutsDialog
- [x] **React Query** — QueryClientProvider в Providers wrapper
- [x] **Нет Zod-валидации** — Zod-схема для прокси API
- [x] **React Query / SWR** — QueryClientProvider установлен, готов к миграции компонентов

### Типизация
- [x] **`noImplicitAny: true`** — включена строгая типизация
- [x] **`moduleData?: Record<string, unknown>`** в `Widget` типе — уточнён до `WidgetType` union type, мёртвое поле удалено

---

## Тестирование / Testing

- [x] **Unit-тесты (Vitest)** — 99 тестов: store (29), API client (13), proxy (8), i18n (4), export-utils (21), chart-palettes (24)
- [ ] **E2E-тесты (Playwright)** — не установлен

---

## DevOps / CI/CD

- [x] **CI/CD** — GitHub Actions: lint + format + typecheck + test + build
- [x] **Dockerfile** — многостадийный Docker build
- [x] **docker-compose.yml** —一键 запуск
- [x] **`.env.example`** — шаблон переменных окружения
- [x] **Prettier** — единый формат + tailwindcss-плагин
- [x] **.dockerignore** — ускорение сборки Docker

---

## UX/UI

- [x] **Skeleton-загрузки** — skeleton-карточки для дашбордов и источников данных
- [x] **Пустые состояния** — для дашбордов, источников, плагинов, модулей
- [x] **AlertDialog** — подтверждение удаления для дашбордов и источников
- [x] **a11y** — skip-to-content link для клавиатуры/скринридеров

---

## Документация

- [x] **CONTRIBUTING.md** — инструкции для контрибьюторов
- [x] **README обновлён** — bun вместо npm, Vitest в tech table, roadmap обновлён
- [x] **OpenGraph + Twitter Cards** — SEO мета-теги

---

## Приоритеты

| Приоритет | Задачи |
|-----------|--------|
| P0 — Блокеры | ~~Убрать `.env`~~, ~~включить `noImplicitAny`~~, ~~исправить SSRF~~ |
| P1 — Важное | ~~Unit-тесты~~, ~~CI/CD~~, ~~Dockerfile~~, ~~lazy loading~~, ~~Server Components~~ |
| P2 — Среднее | ~~i18n~~, ~~React Query~~, ~~Prettier~~, ~~import/export~~ |
| P3 — Желательное | ~~A11y~~, ~~skeleton~~, ~~CONTRIBUTING.md~~ |
| P4 — Будущее | WebSocket, PDF экспорт, E2E тесты, Cookie-based auth |
