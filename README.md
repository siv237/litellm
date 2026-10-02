<h1 align="center">🚂 ruLiteLLM</h1>

<p align="center">
  <b>Русскоязычный AI-шлюз (AI Gateway) для 100+ LLM — self-hosted, на базе MIT-ядра LiteLLM.</b><br/>
  Единый интерфейс в формате OpenAI к любой модели: локальные vLLM-серверы и внешние провайдеры.
</p>

<p align="center">
  <a href="https://github.com/BerriAI/litellm" target="_blank">Оригинал LiteLLM</a> ·
  <a href="https://docs.litellm.ai" target="_blank">Документация ядра</a>
</p>

---

## Что это

**ruLiteLLM** — это **полный форк (хард-форк)** проекта [LiteLLM](https://github.com/BerriAI/litellm) (BerriAI, MIT).
Хард-форк означает, что мы ответвились от проекта ради собственного пути: не зеркалируем upstream
и не наследуем прямо его коммерческую (enterprise) часть — всё недостающее реализуем сами с нуля
в MIT-ядре и ведём ветку независимо.

## Цель форка

1. **Руссификация** — полный перевод админ-интерфейса и отображаемых литералов UI на русский язык;
   в переведённых литералах продукт называется **ruLiteLLM** (идентификаторы, env-имена и URL не трогаем).
2. **Улучшение функционала своими силами** — недостающий функционал коммерческой версии
   реализуется с нуля в форке (прецеденты: лимит SSO-пользователей через env `LITELLM_SSO_FREE_USER_LIMIT`,
   гейт `/openapi.json` по сессии, скрытие FastAPI-доков: `NO_DOCS`/`NO_REDOC`/`NO_OPENAPI`).
3. **Эксплуатация у нас** — публичные репы не нужны, деплой из wheel/pip вместе с torch+CUDA,
   прод-развёртывание по нашему рунбуку.

## Структура репозитория

| Что | Где |
|---|---|
| Ядро прокси (Python) | `litellm/` |
| Админ-UI (Next.js/React, локализуем) | `ui/litellm-dashboard/src/` |
| Ассеты бренда | `ui/litellm-dashboard/public/assets/logos/` (знак `rulitellm_mark.png`) |
| Гайд по коду форка | `CLAUDE.md` / `AGENTS.md` |

## Быстрый старт

```bash
pip install litellm[proxy]        # установка из wheel вместе с torch+CUDA
litellm --model <псевдоним> --api_base <url>   # запуск шлюза
```

Далее в браузере откроется локализованный админ-интерфейс ruLiteLLM (вкладка «ruLiteLLM Dashboard»).
Полное описание возможностей ядра (AI Gateway, SDK, список 100+ провайдеров, MCP/A2A, гардрейлы,
budgets/keys) — в [документации LiteLLM](https://docs.litellm.ai/docs/simple_proxy); форк наследует
MIT-ядро и переводит его UI, а не переписывает API.

## Локализация UI (цикл перевода)

Перевод идёт вехами по конвейеру: пачка файлов из очереди → карта EN→RU → прогон → тесты →
коммит → артефакты сборки в прод. Сканер остатка и очередь — в репозитории-вики
(`tools/i18n-scan/scan.mjs`, `out/todo.txt`, `out/baseline.json`); глоссарий и норма перевода —
в `wiki/answers/litellm-ui-i18n.md`.

## Лицензия и происхождение

MIT (как и upstream). Вся история и содержимое унаследованы от LiteLLM (BerriAI) на момент
ответвления; дальнейшее развитие — независимо, своими задачами и своим интерфейсом.
Там, где upstream отдавал отображаемое имя «LiteLLM», локализованный UI отображает «ruLiteLLM».
