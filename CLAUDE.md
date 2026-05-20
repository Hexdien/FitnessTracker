# CLAUDE.md

Instruções para o Claude Code trabalhar neste repositório. Para a descrição funcional do projeto (modelos, regras de negócio, roadmap), ver `docs/contexto.md`.

## Stack

- Python 3.14 + Flask 3
- SQLAlchemy 2 + Alembic
- SQLite por padrão (dev), PostgreSQL em produção (via `DATABASE_URL` ou `USE_POSTGRES=1`)
- Frontend: Jinja2 + JavaScript puro (ES modules) + CSS puro — sem build step

## Como rodar (dev)

```bash
source venv/bin/activate
export FLASK_APP="app.app:create_app"
flask --debug run                       # autoreload de Python + templates
# acesso: http://127.0.0.1:5000
```

Live reload está habilitado em modo `--debug`:
- `TEMPLATES_AUTO_RELOAD=True` recarrega Jinja
- `SEND_FILE_MAX_AGE_DEFAULT=0` desativa cache de static (basta F5 no browser)

Para forçar recarregamento de tabelas no banco vazio: `AUTO_CREATE_TABLES=1 flask --debug run`. O caminho oficial é Alembic.

## Como rodar (produção)

Ver `docs/producao.md`. Compose: `compose.prod.yml`. Gunicorn como entrypoint (`scripts/docker-entrypoint.sh`).

## Estrutura

```
app/
  app.py                # factory create_app, registra blueprints, handlers
  config/config.py      # leitura de env (DATABASE_URL, USE_POSTGRES)
  database/             # engine, SessionLocal, get_db
  models/               # SQLAlchemy models
  routes/               # HTTP: validação, parse, serialização
  services/             # regras de negócio
  templates/
    base.html           # layout, header, nav, status banner
    nutrition.html      # view de registro alimentar + histórico
    catalog.html        # view de catálogo de alimentos
    workout.html        # view de treino
    partials/           # fragmentos reutilizáveis
  static/
    css/                # base.css, components.css, nutrition.css, workout.css
    js/                 # api.js, state.js, food.js, food_log.js, catalog.js, workout.js, main.js
migrations/             # Alembic
scripts/                # seed, deploy, healthcheck, wait_for_db
```

## Convenções

- **Rotas**: validação e parsing em `routes/`, regra de negócio em `services/`. Não chamar SQLAlchemy direto da rota.
- **Erros**: lançar `ValueError`/`TypeError` no parsing; capturar em `handle_http_exception`.
- **Frontend**: nunca renderizar dados de usuário com template strings sem `escapeHtml()`. Há risco de XSS conhecido — ver `docs/contexto.md` seção "Riscos técnicos".
- **JS**: ES modules nativos (`<script type="module">`), sem bundler. Um módulo por feature.
- **CSS**: tokens em `:root` em `base.css`. Componentes reutilizáveis em `components.css`. CSS por feature nos arquivos próprios.
- **`user_id = 1` fixo**: ainda não há autenticação. Não inventar lógica de auth sem combinar antes.

## O que NÃO fazer

- Não adicionar build step (Vite, webpack, npm) sem combinar antes — é um projeto Flask puro, intencional.
- Não usar `innerHTML` com dados do backend sem escapar — ver função `escapeHtml` em `static/js/state.js`.
- Não rodar `Base.metadata.create_all` em produção. Usar migrations Alembic.
- Não criar testes/docs/refactors fora do escopo pedido. O usuário pede explicitamente quando quer.
- Não commitar `*.db`, `.env*`, `__pycache__/`.

## Comandos úteis

```bash
# Migrations
alembic revision --autogenerate -m "msg"
alembic upgrade head

# Seed de alimentos (idempotente)
python scripts/seed_foods.py

# Healthcheck local
curl http://127.0.0.1:5000/health
```

## Idioma

Comunicação com o usuário e mensagens de commit em **português (BR)**. Identificadores de código em inglês.
