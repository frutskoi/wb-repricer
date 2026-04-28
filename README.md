# wb-repricer

**Wildberries репрайсер** на основе Google Таблиц и Apps Script.

## Что делает
- Читает артикулы (nmId) и целевые цены из Google Таблицы.
- Через Wildberries Supplier API обновляет цены **только для региона Москва**.
- Запускается автоматически по расписанию (каждые 30 минут) через триггер Apps Script.

## Структура проекта
```
wb-repricer/
├─ .clasp.json            # конфигурация clasp (заполнить вашими данными)
├─ .gitignore            # не помещаем секреты в репозиторий
├─ package.json          # npm‑зависимости (clasp + node-fetch)
├─ README.md             # вы сейчас читаете
├─ src/
│   ├─ repricer.gs       # основной Apps Script‑код
│   └─ helpers.js        # вспомогательные функции (по желанию)
└─ .github/
    └─ workflows/
        └─ deploy.yml    # (опцион) CI‑деплой в Google Apps Script
```

## Как развернуть
1. **Склонировать репозиторий** (уже сделано в OpenClaw).
2. **Установить `clasp`**
   ```bash
   npm i -g @google/clasp
   ```
3. **Создать сервисный аккаунт в Google Cloud** и добавить в него роли:
   - `Roles > Service Account User`
   - `Roles > Cloud Scheduler Job Runner` (если планируете запускать через Cloud Scheduler)
   - Включите API: **Google Sheets API**, **Google Drive API**, **Google Apps Script API**.
   - Скачайте JSON‑ключ и **не кладите его в репозиторий**!
4. **Настроить свойства скрипта** (внутри Apps Script):
   - `WB_API_KEY` – ваш Supplier API‑ключ Wildberries.
   - `WB_SUPPLIER_ID` – ваш ID поставщика.
   - `SERVICE_ACCOUNT_JSON` – поместите JSON‑ключ в секрет GitHub (`SERVICE_ACCOUNT_JSON`).
5. **Инициализировать `clasp`**
   ```bash
   cd wb-repricer
   clasp login --creds service-account.json   # используйте файл из секрета
   clasp create --title "WB Repricer" --type sheets
   ```
   При первом запуске появится `scriptId` – запишите его в `.clasp.json`.
6. **Создать Google Таблицу** (можно вручную) с листом `PriceControl` и следующими колонками:
   - `Артикул (nmId)`
   - `Текущая цена`
   - `Цена конкурентов (Мск)`
   - `Целевая цена`
   - `Статус обновления`
   Сохраните ID таблицы (URL‑часть `.../d/<SPREADSHEET_ID>/edit`).
7. **Заполнить `src/repricer.gs`** (шаблон уже в репозитории). Поставьте ваш `SPREADSHEET_ID` в переменную `SHEET_ID`.
8. **Развернуть скрипт**
   ```bash
   clasp push
   ```
9. **Создать триггер** (внутри Apps Script запустите `createTimeDrivenTrigger`).

## Авто‑деплой через GitHub Actions (опционально)
Файл `.github/workflows/deploy.yml` уже готов. Добавьте в репозиторий секреты:
- `GH_TOKEN` – ваш GitHub‑токен (уже используется для репо).
- `SERVICE_ACCOUNT_JSON` – JSON‑ключ сервисного аккаунта (в одну строку).
- `WB_API_KEY` и `WB_SUPPLIER_ID` – ключи Wildberries.

После пуша в `main` CI автоматически выполнит `clasp push` и обновит ваш Apps Script.

---
*Выполнено автоматически OpenClaw.*