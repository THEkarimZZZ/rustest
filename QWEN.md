# Проверяй — Образовательная платформа для тестирования

## Обзор проекта

**Проверяй** — это веб-платформа для создания тестов и управления учебными классами. Основной фокус — строгий академический дизайн, мобильная доступность для учеников и глубокая аналитика для преподавателей.

### Ключевые возможности

- ✅ **Конструктор тестов** — вопросы разных типов (choice, multi, text, info_block)
- ✅ **Градация оценок** — автоматический перевод % баллов в оценки (2, 3, 4, 5) по настраиваемой шкале
- ✅ **Аналитика** — графики распределения оценок, качества знаний, гистограмма баллов, анализ нарушений
- ✅ **Управление классами** — создание классов, инвайт-коды, управление учениками
- ✅ **Анти-фрод** — детектирование потери фокуса, rate limiting, блокировка копирования
- ✅ **Экспорт в Excel** — выгрузка результатов тестов в .xlsx
- ✅ **Соответствие ФЗ-152** — обязательное согласие на обработку ПД при регистрации

---

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Frontend | React 19 + TypeScript |
| Сборщик | Vite 8 |
| Стили | Tailwind CSS v4 |
| UI-компоненты | Кастомные (shadcn/ui стиль) |
| Иконки | Lucide Icons |
| Анимации | Motion (Framer Motion) |
| Графики | Recharts |
| Backend & Auth | Supabase (PostgreSQL, Auth) |
| Роутинг | React Router v7 |
| Экспорт данных | xlsx (SheetJS), file-saver |

---

## Архитектура базы данных (Supabase)

### Таблицы

1. **profiles** — `id, full_name, role (teacher/student), legal_accepted_at, created_at`
2. **classes** — `id, name, teacher_id, invite_code (unique), share_token`
3. **class_members** — `class_id, student_id (fk → profiles), joined_at`
4. **tests** — `id, teacher_id, class_id, title, description, grading_scale (JSONB), settings (JSONB), anti_fraud_settings (JSONB), is_published, share_token`
5. **questions** — `id, test_id, type (choice/multi/text/info_block), content, options (JSONB), correct_answer (JSONB), points, order_index, hint`
6. **results** — `id, test_id, student_id, raw_score, total_possible, percentage, final_grade, answers (JSONB), focus_loss_count, violations (JSONB), finished_at`

### Формула расчёта

```
P = (Набранные баллы / Макс. баллы) × 100
```

Результат `P` сопоставляется с `grading_scale` теста для определения итоговой оценки.

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Supabase

1. Создайте проект на [Supabase](https://supabase.com)
2. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
3. Обновите переменные в `.env` вашими данными из Supabase

### 3. Применение миграций базы данных

1. Откройте SQL Editor в панели Supabase
2. Выполните скрипты из `database/migrations/`:
   - `001_initial_schema.sql` — основная схема
   - `002_fixes.sql` — исправления и дополнения

### 4. Запуск dev-сервера

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Сборка проекта (TypeScript + Vite) |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | Проверка кода ESLint |

---

## Структура проекта

```
rustest/
├── database/
│   └── migrations/                  # SQL миграции
│       ├── 001_initial_schema.sql   # Основная схема БД
│       └── 002_fixes.sql            # Исправления и дополнения
├── src/
│   ├── components/
│   │   ├── analytics/               # Компоненты аналитики
│   │   │   ├── GradeDistributionChart.tsx  # Распределение оценок
│   │   │   ├── ScoreHistogram.tsx          # Гистограмма баллов
│   │   │   ├── QualityIndicator.tsx        # Качество знаний
│   │   │   ├── FraudAnalysis.tsx           # Анализ нарушений
│   │   │   └── index.ts
│   │   ├── ui/                      # UI компоненты
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── Layout.tsx               # Основной layout с header/footer
│   │   └── ProtectedRoute.tsx       # Защита маршрутов по роли
│   ├── context/
│   │   └── AuthContext.tsx          # Авторизация и профиль
│   ├── hooks/
│   │   ├── useAntiFraud.ts          # Хук анти-фрод системы
│   │   ├── useInView.ts             # Intersection Observer
│   │   └── useScrollReveal.ts       # Анимации при скролле
│   ├── lib/
│   │   ├── supabase.ts              # Supabase клиент
│   │   ├── export.ts                # Экспорт в Excel
│   │   └── utils.ts                 # Утилиты (cn)
│   ├── pages/
│   │   ├── teacher/
│   │   │   ├── Dashboard.tsx        # Личный кабинет учителя
│   │   │   ├── TestConstructor.tsx  # Конструктор тестов
│   │   │   └── TestResults.tsx      # Результаты + аналитика
│   │   ├── student/
│   │   │   ├── Dashboard.tsx        # Личный кабинет ученика
│   │   │   ├── TestTaking.tsx       # Прохождение теста
│   │   │   ├── TestReview.tsx       # Просмотр ответов
│   │   │   ├── JoinClass.tsx        # Вход в класс по коду
│   │   │   └── JoinTest.tsx         # Вход в тест по токену
│   │   ├── Home.tsx                 # Главная страница
│   │   ├── Login.tsx                # Авторизация
│   │   ├── Register.tsx             # Регистрация
│   │   ├── PrivacyPolicy.tsx        # Политика конфиденциальности
│   │   ├── TermsOfService.tsx       # Пользовательское соглашение
│   │   └── TestConnection.tsx       # Тест подключения к Supabase
│   ├── App.tsx                      # Роутинг
│   ├── main.tsx                     # Точка входа
│   └── index.css                    # Глобальные стили (Tailwind)
├── .env.example                     # Пример переменных окружения
├── vite.config.ts                   # Конфигурация Vite
├── tsconfig.app.json                # TypeScript
├── package.json
└── README.md
```

---

## Статус реализации

### ✅ Завершено

| Модуль | Статус |
|--------|--------|
| Auth + регистрация | ✅ Полностью |
| Legal (ФЗ-152) | ✅ Полностью |
| Кабинет учителя | ✅ Полностью |
| Управление классами | ✅ Полностью |
| Конструктор тестов | ✅ Полностью |
| Прохождение теста | ✅ Полностью |
| Анти-фрод система | ✅ Полностью |
| Аналитика и графики | ✅ Полностью |
| Экспорт в Excel | ✅ Полностью |

### 📋 Текущие задачи

- [ ] Включить RLS обратно (сейчас отключён для classes/class_members для разработки)
- [ ] Тестирование RLS policies
- [ ] Тёмная тема (сейчас только светлая)
- [ ] Toast-уведомления (замена alert/confirm)
- [ ] Rate limiting на сервере (Supabase Edge Functions)

### 💡 Будущие улучшения

- [ ] Шаринг теста по ссылке/токену (share_token уже в БД)
- [ ] Клонирование теста
- [ ] Шаблоны тестов
- [ ] Импорт вопросов из файла
- [ ] Массовое добавление учеников

---

## Разработка

### Добавление новых UI компонентов

Компоненты создаются вручную в `src/components/ui/` в стиле shadcn/ui. Используйте утилиту `cn()` из `@/lib/utils` для условного объединения классов.

### Аналитика

Новые графики добавляются в `src/components/analytics/`. Экспорт через `index.ts`. Используйте Recharts для визуализации.

### Типизация

Проект использует строгую типизацию TypeScript. Все новые файлы должны быть типизированы.

### Линтинг

```bash
npm run lint
```

---

## Соответствие ФЗ-152

При регистрации пользователь обязан:
- ✅ Принять политику конфиденциальности
- ✅ Принять пользовательское соглашение
- ✅ Дать согласие на обработку персональных данных

Время согласия (`legal_accepted_at`) фиксируется в профиле.

---

## Лицензия

© 2026 Проверяй. Все права защищены.
