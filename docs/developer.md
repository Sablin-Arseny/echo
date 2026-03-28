# Документация разработчика Echo

Руководство для разработчиков, которые клонируют репозиторий, настраивают окружение и вносят изменения в backend, frontend и инфраструктуру. Обзор продукта и запуск — в [README.md](../README.md). Подробное описание экранов для конечных пользователей — в [user.md](user.md). Диаграммы слоёв, C4 и схема БД — в [architecture.md](architecture.md).

---

## 1. Стек и версии

| Компонент | Технология |
|-----------|------------|
| Backend | Python 3.12, FastAPI, Uvicorn |
| БД | PostgreSQL 17 (в Compose), драйвер asyncpg |
| ORM | SQLAlchemy 2.x (async) |
| Валидация / настройки | Pydantic v2, pydantic-settings |
| Аутентификация | JWT (python-jose), bcrypt (passlib) |
| Frontend | Статический HTML/CSS/JS (`newui/`) |
| Продакшен-стек локально | Docker Compose: app + PostgreSQL + Nginx |

Точные версии зависимостей — в `requirements.txt`.

---

## 2. Структура репозитория (для разработки)

```
echo/
├── app/                      # Backend
│   ├── main.py               # FastAPI-приложение, CORS, lifespan → init_db
│   ├── config.py             # Settings из .env (pydantic-settings)
│   └── src/
│       ├── api/              # HTTP-слой
│       │   ├── api.py        # Сборка роутеров и префиксов
│       │   ├── duty.py       # Служебные маршруты (например /ping)
│       │   └── v1/           # auth, user, event, budget, task
│       ├── services/         # Бизнес-логика, зависимости через Depends / get_as_dependency
│       ├── db/               # Репозитории: сессии, CRUD по сущностям
│       ├── models/           # SQLAlchemy ORM
│       └── schemas/          # Pydantic-модели запросов/ответов API
├── newui/                    # Фронтенд: html/, css/, js/, images/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf            # Статика + прокси /api/ → backend
├── docs/                     # Документация
├── requirements.txt
└── .env                      # Локально (не коммитить)
```

**Поток данных:** роутер (`api/v1/*.py`) → сервис (`services/*.py`) → слой БД (`db/*.py`) → модели (`models/*.py`). Схемы Pydantic в `schemas/` описывают контракт API и часто используются в сервисах.

---

## 3. Окружение и переменные

Создайте `.env` в **корне** репозитория. `app/config.py` читает его через `BaseSettings` (имена полей в нижнем регистре, как в примере ниже).

Обязательно задайте надёжный `secret_key` для JWT вне разработки.

| Переменная | Назначение |
|------------|------------|
| `app_host`, `app_port` | Хост и порт Uvicorn (по умолчанию `0.0.0.0`, `8000`) |
| `db_host`, `db_port`, `db_name`, `db_user`, `db_password` | Подключение PostgreSQL |
| `db_echo` | `true` — лог SQL в консоль (удобно при отладке) |
| `secret_key` | Секрет подписи JWT |

При запуске через Compose переменная `db_host` для сервиса `app` переопределяется на `postgre-db` (см. `docker/docker-compose.yml`).

**Важно для Docker:** `docker/Dockerfile` копирует `.env` в образ. Для CI или чистой сборки без секретов может понадобиться заглушка или изменение Dockerfile под ваш процесс.

---

## 4. Запуск для разработки

### 4.1. Полный стек (рекомендуется)

Из корня:

```bash
docker compose -f docker/docker-compose.yml up --build
```

- UI: http://localhost:8001  
- API напрямую: http://localhost:8000  
- PostgreSQL: localhost:5432  

Данные БД — volume `db-data`.

### 4.2. Только backend (без Docker)

1. Поднимите PostgreSQL и создайте БД (имя как в `.env`, по умолчанию `echo_db`).
2. Установите зависимости и задайте `PYTHONPATH` на родительскую папку `app`:

```bash
pip install -r requirements.txt
export PYTHONPATH=/абсолютный/путь/к/echo   # родитель каталога app/
cd app && python main.py
```

Фронтенд при этом откройте отдельно (любой статический сервер для `newui/`) и учтите, что в коде используется префикс `/api` (см. раздел про Nginx).

### 4.3. OpenAPI / Swagger

После старта backend интерактивная документация: **http://localhost:8000/docs** (схемы и try-it-out).

---

## 5. Backend: детали реализации

### 5.1. Точка входа и жизненный цикл

`app/main.py` создаёт `FastAPI`, подключает единый роутер из `app.src.api.api`, включает CORS (`allow_origins=["*"]` — для продакшена обычно сужают). В `lifespan` вызывается `init_db()` из `app.src.models.base`.

### 5.2. Подключение к БД

`app/src/db/core.py` собирает URL `postgresql+asyncpg://...`, создаёт `async_engine` и фабрику `AsyncSession`. Классы в `db/` наследуют `BaseDB` и используют контекстный менеджер `create_session()` (commit при успехе, rollback при исключении).

### 5.3. Инициализация схемы БД

`init_db()` вызывает `Base.metadata.create_all(..., checkfirst=True)` — таблицы создаются при старте, если их нет. Отдельного Alembic в репозитории может не быть; для ручных изменений смотрите SQL в `docs/` (например `task_migration.sql`).

### 5.4. Маршруты API

Корневой роутер (`app/src/api/api.py`) монтирует:

| Префикс | Модуль | Тег Swagger |
|---------|--------|-------------|
| *(пусто)* | `duty` | duty — например `GET /ping` |
| `/budget` | `v1/budget` | budget |
| `/user` | `v1/user` | user |
| `/event` | `v1/event` | event |
| `/auth` | `v1/auth` | auth |
| `/task` | `v1/task` | task |

Проверка живости: `GET /ping` → ответ `pong`.

### 5.5. Зависимости и сервисы

Паттерн: у классов сервисов и `*DB` часто есть `get_as_dependency()` (иногда с `@cache`), возвращающий экземпляр для `Depends(...)`. Роутеры получают сервисы и текущего пользователя через `Depends(AuthService.check_auth)` там, где нужна авторизация.

### 5.6. Аутентификация (важно для безопасности и отладки)

- Алгоритм JWT: **HS256**, секрет — `settings.secret_key`.
- В payload попадают данные пользователя и `password_hash`; при `check_auth` выполняется сверка хеша с записью в БД (отзыв пароля меняет хеш — старые токены перестают работать).
- В `jwt.decode` задано `verify_exp: False` — **срок действия токена не проверяется**. Для продакшена стоит включить проверку `exp` и выдачу refresh-токенов по отдельному дизайну.

Заголовок: `Authorization: Bearer <token>`.

### 5.7. Модули фронтенда и API

В `newui/js/*.js` базовый URL задан как **`/api`** (см. `userApi.js`). Nginx проксирует `location /api/` на `http://app:8000/` с завершающим слэшем, поэтому запрос к `/api/auth/login` уходит на backend как `/auth/login` — префиксы из таблицы выше совпадают.

При разработке без Nginx либо поднимите прокси с тем же правилом, либо временно меняйте `API_BASE` на `http://localhost:8000` (без дублирования префикса `/api` в пути, если прокси нет).

Модуль `api.js` экспортирует фасад `SmartAPI`, агрегирующий вызовы к `eventApi`, `userApi`, `budgetApi`, `taskApi`.

---

## 6. Docker и Nginx

- **app:** сборка из контекста `..`, Dockerfile в `docker/Dockerfile`, рабочая директория в образе — код из `app/`.
- **postgre-db:** образ `postgres:17`, учётные данные синхронизируйте с `.env` при локальной отладке вне контейнера.
- **nginx:** порт `8001`, корень статики — `newui/html`, алиасы для `/css/`, `/js/`, `/images/`.

---

## 7. CI

Файл `.github/workflows/linter.yml`: при push в ветки **кроме** `main` запускаются два job’а Super-Linter — JavaScript (ES) и Python (Black). При расширении пайплайна имеет смысл добавить pytest и линтеры под актуальный стиль Python-проекта.

---

## 8. Типовой чеклист при добавлении функции

1. **Модель** — при новой таблице: `models/`, импорт в `models/__init__.py` при необходимости.
2. **Схемы** — `schemas/` для входа/выхода API.
3. **DB-слой** — методы в соответствующем `db/*.py`, сессии через `BaseDB.create_session`.
4. **Сервис** — правила и оркестрация в `services/*.py`.
5. **Роутер** — эндпоинты в `api/v1/`, регистрация префикса в `api/api.py`.
6. **Фронт** — при необходимости новый или существующий `newui/js/*Api.js` и страницы в `newui/html/`.
7. **Документация** — после изменения контракта API достаточно актуального OpenAPI (`/docs`); при ручных миграциях — SQL в `docs/` или отдельный процесс миграций.

---

## 9. Отладка

- Включите `db_echo=true` в `.env` для просмотра SQL.
- Проверка доступности приложения: `curl http://localhost:8000/ping`.
- Ошибки валидации и 422 смотрите в ответе FastAPI и в Swagger.

---

## 10. Ссылки внутри репозитория

| Документ | Содержание |
|----------|------------|
| [README.md](../README.md) | Описание продукта, env, запуск, сценарии |
| [user.md](user.md) | Руководство пользователя по интерфейсу |
| [architecture.md](architecture.md) | Слои, диаграммы, схема БД |

Если что-то в коде расходится с этим файлом, приоритет у фактического поведения в репозитории — обновите документ вместе с изменением.
