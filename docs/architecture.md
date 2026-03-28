# Архитектура проекта Echo

## Описание проекта

Echo — веб-приложение для управления событиями и бюджетами. Приложение позволяет пользователям создавать события, управлять участниками, отслеживать бюджеты и расходы, вести задачи в рамках мероприятия.

Диаграммы и перечисления ниже приведены в соответствие с текущим кодом в репозитории (`app/src`, `docker/`, `requirements.txt`). Дополнительно к перечисленным роутерам в `app/src/api/api.py` подключён служебный модуль **`duty`** (например, `GET /ping`).

## Основные слои архитектуры

Архитектура приложения построена на основе трехслойной модели:

1. **Presentation Layer (Слой представления)** - Frontend (HTML/CSS/JS) + API endpoints (FastAPI)
2. **Business Logic Layer (Слой бизнес-логики)** - Services (EventService, BudgetService, TaskService, AuthService)
3. **Data Access Layer (Слой доступа к данным)** - Database layer (EventDB, UserDB, BudgetDB) + ORM Models (SQLAlchemy)

---

## 1. C4 Component Diagram (Level 3) - Ключевые компоненты

```plantuml
@startuml C4_Component_Diagram
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

LAYOUT_WITH_LEGEND()

title Component Diagram - Echo Application

Container_Boundary(api, "FastAPI Application") {
    Component(api_router, "API Router", "FastAPI", "Маршрутизация запросов к различным endpoints")
    Component(auth_api, "Auth API", "FastAPI Router", "Endpoints для аутентификации")
    Component(event_api, "Event API", "FastAPI Router", "Endpoints для управления событиями")
    Component(budget_api, "Budget API", "FastAPI Router", "Endpoints для управления бюджетами и расходами")
    Component(user_api, "User API", "FastAPI Router", "Endpoints для управления пользователями")
    Component(task_api, "Task API", "FastAPI Router", "Endpoints для задач мероприятия")
    
    Component(auth_service, "Auth Service", "Python Class", "Бизнес-логика аутентификации и авторизации")
    Component(event_service, "Event Service", "Python Class", "Бизнес-логика управления событиями")
    Component(budget_service, "Budget Service", "Python Class", "Бизнес-логика управления бюджетами")
    Component(task_service, "Task Service", "Python Class", "Бизнес-логика задач")
    
    Component(event_db, "Event DB", "Python Class", "Доступ к данным событий")
    Component(user_db, "User DB", "Python Class", "Доступ к данным пользователей")
    Component(budget_db, "Budget DB", "Python Class", "Доступ к данным бюджетов и долей расходов")
    Component(task_db, "Task DB", "Python Class", "Доступ к данным задач")
    
    ComponentDb(models, "ORM Models", "SQLAlchemy", "Event, User, Budget, EventMember и др.")
}

ContainerDb(database, "PostgreSQL", "PostgreSQL 17", "Хранение всех данных приложения (образ postgres:17 в Compose)")

Container(frontend, "Web Frontend", "HTML/CSS/JavaScript", "Пользовательский интерфейс")

Person(user, "Пользователь", "Пользователь приложения Echo")

Rel(user, frontend, "Использует", "HTTP/HTTPS")
Rel(frontend, api_router, "Делает API запросы", "JSON (через Nginx /api/ → backend)")

Rel(api_router, auth_api, "Маршрутизирует")
Rel(api_router, event_api, "Маршрутизирует")
Rel(api_router, budget_api, "Маршрутизирует")
Rel(api_router, user_api, "Маршрутизирует")
Rel(api_router, task_api, "Маршрутизирует")

Rel(auth_api, auth_service, "Использует")
Rel(event_api, event_service, "Использует")
Rel(event_api, auth_service, "Проверяет авторизацию")
Rel(budget_api, budget_service, "Использует")
Rel(budget_api, auth_service, "Проверяет авторизацию")
Rel(task_api, task_service, "Использует")
Rel(task_api, auth_service, "Проверяет авторизацию")

Rel(event_service, event_db, "Использует")
Rel(event_service, user_db, "Использует")
Rel(budget_service, budget_db, "Использует")
Rel(budget_service, user_db, "Использует")
Rel(task_service, task_db, "Использует")
Rel(auth_service, user_db, "Использует")

Rel(event_db, models, "Использует")
Rel(user_db, models, "Использует")
Rel(budget_db, models, "Использует")
Rel(task_db, models, "Использует")

Rel(models, database, "Читает/Записывает", "SQL/TCP")

@enduml
```

---

## 2. Deployment Diagram - Диаграмма развертывания

```plantuml
@startuml Deployment_Diagram
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml

LAYOUT_WITH_LEGEND()

title Deployment Diagram - Echo Application

Deployment_Node(docker_host, "Docker Host", "Linux Server") {
    Deployment_Node(nginx_container, "Nginx Container", "Docker Container") {
        Container(nginx, "Nginx", "nginx:latest", "Веб-сервер для статических файлов и reverse proxy")
    }
    
    Deployment_Node(app_container, "App Container", "Docker Container") {
        Container(fastapi_app, "FastAPI Application", "Python 3.12 + FastAPI", "Backend приложение")
    }
    
    Deployment_Node(db_container, "PostgreSQL Container", "Docker Container") {
        ContainerDb(postgres, "PostgreSQL", "postgres:17", "База данных")
    }
    
    Deployment_Node(volume, "Docker Volume", "Persistent Storage") {
        ContainerDb(db_data, "db-data", "Volume", "Постоянное хранилище данных БД")
    }
}

Person(user, "Пользователь")

Rel(user, nginx, "Открывает веб-интерфейс", "HTTP:8001 (локально)")
Rel(nginx, fastapi_app, "Проксирует API запросы", "HTTP:8000")
Rel(fastapi_app, postgres, "Выполняет SQL запросы", "TCP:5432")
Rel(postgres, db_data, "Сохраняет данные")

note right of nginx
  Порты:
  - 8001:8001 (Frontend)
  
  Volumes:
  - ../newui:/usr/share/nginx/newui
  - nginx.conf
end note

note right of fastapi_app
  Порты:
  - 8000:8000 (API)
  
  Environment:
  - db_host=postgre-db
  - Переменные из .env
end note

note right of postgres
  Порты:
  - 5432:5432
  
  Environment:
  - POSTGRES_DB=echo_db
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=postgres
end note

@enduml
```

---

## 3. Layered Architecture Diagram - Слои архитектуры

```plantuml
@startuml Layered_Architecture
!define RECTANGLE class

skinparam rectangle {
    BackgroundColor<<presentation>> LightBlue
    BackgroundColor<<business>> LightGreen
    BackgroundColor<<data>> LightYellow
    BackgroundColor<<database>> LightCoral
}

rectangle "Presentation Layer" <<presentation>> {
    rectangle "Web Frontend\n(HTML/CSS/JS)" as frontend
    rectangle "API Endpoints\n(FastAPI Routers)" as api {
        rectangle "auth_router" as auth_api
        rectangle "event_router" as event_api
        rectangle "budget_router" as budget_api
        rectangle "user_router" as user_api
        rectangle "task_router" as task_api
    }
}

rectangle "Business Logic Layer" <<business>> {
    rectangle "Services" as services {
        rectangle "AuthService\n- check_auth()\n- generate_jwt()" as auth_service
        rectangle "EventService\n- create()\n- update()\n- get_participants()" as event_service
        rectangle "BudgetService\n- get / создание расходов\n- участники трат" as budget_service
        rectangle "TaskService\n- CRUD задач\n- статусы, наблюдатели" as task_service
    }
}

rectangle "Data Access Layer" <<data>> {
    rectangle "Database Layer" as db_layer {
        rectangle "EventDB\n- create_event()\n- get_event_by_id()\n- add_relation_event_member()" as event_db
        rectangle "UserDB\n- get()\n- create()" as user_db
        rectangle "BudgetDB\n- операции с budget /\nexpense_participants" as budget_db
        rectangle "TaskDB\n- задачи, комментарии" as task_db
    }
    rectangle "ORM Models\n(SQLAlchemy)" as models {
        rectangle "Event" as event_model
        rectangle "User" as user_model
        rectangle "Budget" as budget_model
        rectangle "EventMember" as event_member_model
        rectangle "Task (+ TaskObserver,\nTaskComment)" as task_model
    }
}

rectangle "Database" <<database>> {
    database "PostgreSQL\necho_db" as postgres
}

frontend -down-> api : "HTTP/JSON"
api -down-> services : "Function calls"
services -down-> db_layer : "Function calls"
db_layer -down-> models : "ORM operations"
models -down-> postgres : "SQL queries"

auth_api -down-> auth_service
event_api -down-> event_service
budget_api -down-> budget_service
task_api -down-> task_service

event_service -down-> event_db
event_service -down-> user_db
budget_service -down-> budget_db
budget_service -down-> user_db
task_service -down-> task_db
auth_service -down-> user_db

event_db -down-> event_model
event_db -down-> event_member_model
user_db -down-> user_model
budget_db -down-> budget_model
task_db -down-> task_model

note right of services
  Принцип GRASP: Information Expert
  Сервисы содержат бизнес-логику
  и координируют работу с данными
end note

note right of db_layer
  Принцип GRASP: Low Coupling
  DB классы изолируют логику
  работы с базой данных
end note

@enduml
```

---

## 4. Sequence Diagram - Создание события пользователем

```plantuml
@startuml Event_Creation_Sequence
title Создание события пользователем

actor "Пользователь" as User
participant "Web Frontend" as Frontend
participant "API Router" as Router
participant "Event API" as EventAPI
participant "Auth Service" as AuthService
participant "Event Service" as EventService
participant "Event DB" as EventDB
participant "User DB" as UserDB
database "PostgreSQL" as DB

User -> Frontend: Заполняет форму\nсоздания события
activate Frontend

Frontend -> Router: POST /event/create\n+ JWT token\n+ event data
activate Router

Router -> EventAPI: create_event(event, token)
activate EventAPI

EventAPI -> AuthService: check_auth(token)
activate AuthService
AuthService -> UserDB: get() по данным из JWT
activate UserDB
UserDB -> DB: SELECT * FROM users\nWHERE id = ?
activate DB
DB --> UserDB: user_data
deactivate DB
UserDB --> AuthService: User object
deactivate UserDB
AuthService --> EventAPI: User object
deactivate AuthService

EventAPI -> EventService: create(event, user)
activate EventService

EventService -> UserDB: get(participant_ids)
activate UserDB
UserDB -> DB: SELECT * FROM users\nWHERE id IN (?)
activate DB
DB --> UserDB: participants_data
deactivate DB
UserDB --> EventService: List[User]
deactivate UserDB

EventService -> EventDB: create_event(event_data)
activate EventDB
EventDB -> DB: INSERT INTO events\nVALUES (...)
activate DB
DB --> EventDB: event_id
deactivate DB
EventDB --> EventService: Event object
deactivate EventDB

EventService -> EventDB: add_relation_event_member\n(event_id, creator, role=OWNER)
activate EventDB
EventDB -> DB: INSERT INTO event_member\n(status=DRAFT, role=OWNER)
activate DB
DB --> EventDB: success
deactivate DB
EventDB --> EventService: success
deactivate EventDB

loop Для каждого участника из списка
    EventService -> EventDB: add_relation_event_member\n(event_id, participant, role=PARTICIPANT)
    activate EventDB
    EventDB -> DB: INSERT INTO event_member\n(status=DRAFT, role=PARTICIPANT)
    activate DB
    DB --> EventDB: success
    deactivate DB
    EventDB --> EventService: success
    deactivate EventDB
end

EventService -> EventDB: update_status_of_member\n(event_id, creator_id, 'PARTICIPATING')
activate EventDB
EventDB -> DB: UPDATE event_member\nSET status = 'PARTICIPATING'\nWHERE event_id = ? AND user_id = ?
activate DB
DB --> EventDB: success
deactivate DB
EventDB --> EventService: success
deactivate EventDB

EventService -> EventDB: get_event_by_id(event_id)
activate EventDB
EventDB -> DB: SELECT * FROM events\nWHERE id = ?
activate DB
DB --> EventDB: event_data
deactivate DB
EventDB --> EventService: Event object
deactivate EventDB

EventService --> EventAPI: EventResponse
deactivate EventService

EventAPI -> EventService: get_participants(event_id)
activate EventService
EventService -> EventDB: get_members_by_event_id(event_id)
activate EventDB
EventDB -> DB: SELECT users.*, event_member.status, role\nFROM users JOIN event_member\nWHERE event_id = ?
activate DB
DB --> EventDB: participants_data
deactivate DB
EventDB --> EventService: List[(User, status)]
deactivate EventDB
EventService --> EventAPI: List[Participant]
deactivate EventService

EventAPI --> Router: EventResponse\n+ participants
deactivate EventAPI

Router --> Frontend: JSON response\n(event details)
deactivate Router

Frontend --> User: Отображает\nсозданное событие
deactivate Frontend

@enduml
```

---

## 5. Архитектурные решения и обоснования

### 5.1 Выбор монолитной архитектуры

**Решение:** Использована монолитная архитектура с разделением на слои.

**Обоснование:**
- Проект находится на стадии MVP
- Команда разработки небольшая
- Требования к масштабированию минимальны на текущем этапе
- Упрощенное развертывание и отладка
- Меньше накладных расходов на межсервисную коммуникацию

### 5.2 Трехслойная архитектура

**Решение:** Разделение на Presentation, Business Logic и Data Access слои.

**Обоснование:**
- Четкое разделение ответственности (GRASP: High Cohesion)
- Упрощенное тестирование каждого слоя независимо
- Возможность замены реализации одного слоя без влияния на другие (GRASP: Low Coupling)
- Соответствие принципу единственной ответственности (SRP)

### 5.3 Использование FastAPI

**Решение:** FastAPI в качестве веб-фреймворка.

**Обоснование:**
- Высокая производительность (async/await)
- Автоматическая генерация OpenAPI документации
- Встроенная валидация данных через Pydantic
- Современный подход к разработке API
- Поддержка dependency injection

### 5.4 PostgreSQL как основная БД

**Решение:** PostgreSQL для хранения данных.

**Обоснование:**
- ACID-совместимость для критичных данных (события, бюджеты)
- Поддержка сложных запросов и JOIN операций
- Надежность и зрелость решения
- Хорошая интеграция с SQLAlchemy ORM

### 5.5 Docker Compose для развертывания

**Решение:** Использование Docker Compose для оркестрации контейнеров.

**Обоснование:**
- Упрощенное развертывание всего стека
- Изоляция зависимостей
- Воспроизводимость окружения
- Легкость масштабирования в будущем

---

## 6. Применение принципов GRASP

### 6.1 Information Expert

**Применение:** Каждый сервис (EventService, BudgetService) является экспертом в своей предметной области.

**Пример:**
```python
class EventService:
    async def create(self, event: CreateEventRequest, user: User):
        # EventService знает, как создать событие
        # и управлять участниками
        participants = [await self._user_db.get(User(id=uid)) 
                       for uid in event.participants]
        event = await self._event_db.create_event(...)
        await self._event_db.add_relation_event_member(event.id, user, "OWNER")
        for p in participants:
            await self._event_db.add_relation_event_member(event.id, p, "PARTICIPANT")
```

### 6.2 Low Coupling

**Применение:** Слои взаимодействуют через четко определенные интерфейсы.

**Пример:**
- API слой зависит только от сервисов, не знает о БД
- Сервисы зависят от DB классов, не знают о деталях SQL
- DB классы инкапсулируют работу с базой данных

### 6.3 High Cohesion

**Применение:** Каждый класс имеет четко определенную ответственность.

**Пример:**
- `EventDB` - только операции с БД для событий
- `EventService` - только бизнес-логика событий
- `EventAPI` - только обработка HTTP запросов для событий

### 6.4 Controller

**Применение:** API роутеры выступают в роли контроллеров.

**Пример:**
```python
@router.post("/create")
async def create_event(
    event: CreateEventRequest,
    event_service: EventService = Depends(EventService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> EventResponse:
    # Контроллер координирует вызовы сервисов
    event_response = await event_service.create(event, user)
    participants = await event_service.get_participants(event_response.id)
    return event_response
```

### 6.5 Creator

**Применение:** Фабричные методы для создания зависимостей.

**Пример:**
```python
@classmethod
@cache
def get_as_dependency(cls):
    return cls(
        EventDB.get_as_dependency(),
        UserDB.get_as_dependency(),
    )
```

---

## 7. Технологический стек

### Backend
- **Framework:** FastAPI ~0.119 (см. `requirements.txt`)
- **Language:** Python 3.12 (образ Docker; локально — 3.12+)
- **ORM:** SQLAlchemy ~2.0.x (async, драйвер asyncpg)
- **Validation:** Pydantic ~2.12 + pydantic-settings
- **ASGI Server:** Uvicorn

### Database
- **Primary DB:** PostgreSQL 17 (образ в `docker/docker-compose.yml`)
- **Future:** Redis (для кэширования)

### Frontend
- **Core:** HTML5, CSS3, JavaScript (ES6+)
- **Future:** React/Vue.js для SPA

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Web Server:** Nginx
- **Future:** Kubernetes для production

### Development
- **Version Control:** Git
- **CI:** GitHub Actions — workflow `.github/workflows/linter.yml` (Super-Linter: JS + Python Black на push в ветки, кроме `main`)
- **Future:** Тесты (pytest, coverage), расширенный CI/CD

---

## 8. Диаграмма базы данных

Ниже — упрощённая схема, согласованная с ORM-моделями в `app/src/models/`. Имя таблицы участников события в коде — **`event_member`** (составной первичный ключ). Таблица **`budget`** хранит отдельные расходы (сумма, автор оплаты `paid_by_id`, статус траты); доли участников — в **`expense_participants`** (поле `expense_id` ссылается на `budget.id`). У задач нет поля `deadline` в модели; есть `created_at`, `started_at`, связи **task_observers** и **task_comments**. Таблица **`roles`** объявлена в коде, но роли участников события в **`event_member`** хранятся строкой (`OWNER`, `PARTICIPANT`, `ADMIN` и т.д.), без FK на `roles`.

```plantuml
@startuml Database_Schema
!define Table(name,desc) class name as "desc" << (T,#FFAAAA) >>
!define primary_key(x) <b>x</b>
!define foreign_key(x) <i>x</i>

hide methods
hide stereotypes

Table(users, "users") {
  primary_key(id): INTEGER
  username: VARCHAR
  tg_id: VARCHAR
  full_name: VARCHAR
  password_hash: VARCHAR
}

Table(events, "events") {
  primary_key(id): INTEGER
  name: VARCHAR
  description: VARCHAR
  start_date: TIMESTAMP
  cancel_of_event_date: TIMESTAMP
  created_at: TIMESTAMP
  tg_chat: VARCHAR
  event_place: VARCHAR
}

Table(event_member, "event_member") {
  foreign_key(event_id): INTEGER <<PK>>
  foreign_key(user_id): INTEGER <<PK>>
  status: VARCHAR
  role: VARCHAR
}

Table(budget, "budget") {
  primary_key(id): INTEGER
  foreign_key(event_id): INTEGER
  foreign_key(paid_by_id): INTEGER
  amount: FLOAT
  description: VARCHAR
  status: VARCHAR
}

Table(expense_participants, "expense_participants") {
  primary_key(id): INTEGER
  foreign_key(expense_id): INTEGER
  foreign_key(participant_id): INTEGER
  share_amount: FLOAT
  paid_amount: FLOAT
  status: VARCHAR
}

Table(tasks, "tasks") {
  primary_key(id): INTEGER
  foreign_key(event_id): INTEGER
  foreign_key(author_id): INTEGER
  foreign_key(executor_id): INTEGER
  title: VARCHAR
  description: VARCHAR
  status: VARCHAR
  created_at: TIMESTAMP
  started_at: TIMESTAMP
}

Table(task_observers, "task_observers") {
  foreign_key(task_id): INTEGER <<PK>>
  foreign_key(user_id): INTEGER <<PK>>
}

Table(task_comments, "task_comments") {
  primary_key(id): INTEGER
  foreign_key(task_id): INTEGER
  foreign_key(user_id): INTEGER
  text: TEXT
  created_at: TIMESTAMP
}

Table(media, "media") {
  primary_key(id): INTEGER
  foreign_key(event_id): INTEGER
  foreign_key(user_id): INTEGER
  image_url: VARCHAR
}

Table(roles, "roles") {
  primary_key(id): INTEGER
  name: VARCHAR
}

events "1" -- "0..*" event_member : has
users "1" -- "0..*" event_member : participates
events "1" -- "0..*" budget : has
users "1" -- "0..*" budget : paid_by
budget "1" -- "0..*" expense_participants : splits
users "1" -- "0..*" expense_participants : participant
events "1" -- "0..*" tasks : has
users "1" -- "0..*" tasks : authors
users "1" -- "0..*" tasks : executes
tasks "1" -- "0..*" task_observers : watches
users "1" -- "0..*" task_observers : watches
tasks "1" -- "0..*" task_comments : comments
users "1" -- "0..*" task_comments : writes
events "1" -- "0..*" media : has
users "1" -- "0..*" media : uploads

note bottom of roles
  Таблица есть в моделях;
  event_member.role — строка, не FK
end note

@enduml
```
