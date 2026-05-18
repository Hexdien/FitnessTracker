# Setups: dev e producao

Este projeto roda em dois modos:

- **Dev local**: venv na propria maquina com SQLite. Sem Docker.
- **Producao**: Docker Compose no servidor pessoal da rede local, usando o PostgreSQL ja existente no servidor.

## Dev local (venv + SQLite)

A configuracao padrao em `app/config/config.py` ja aponta para `sqlite:///fitness.db` quando nenhuma variavel de ambiente esta definida, entao nao e preciso criar nenhum `.env` para rodar localmente.

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

venv/bin/alembic upgrade head
venv/bin/python scripts/seed_foods.py
venv/bin/flask --app app.app:create_app run
```

A app sobe em `http://127.0.0.1:5000` e usa o arquivo `fitness.db` na raiz do projeto (ignorado pelo Git).

Reset do banco de dev:

```bash
rm -f fitness.db
venv/bin/alembic upgrade head
venv/bin/python scripts/seed_foods.py
```

## Producao (Docker Compose + Postgres)

O `compose.prod.yml` sobe apenas o servico `app`. Ele espera `DATABASE_URL` apontando para o PostgreSQL ja existente no servidor.

No servidor, crie `.env.production` a partir de `.env.example`:

```bash
cp .env.example .env.production
```

Edite `DATABASE_URL` com host/usuario/senha reais.

Exemplo minimo de `.env.production`:

```env
APP_HOST_PORT=8000
DATABASE_URL=postgresql://fitness:SENHA@IP_OU_HOST_DO_POSTGRES:5432/fitness
RUN_MIGRATIONS=1
RUN_FOOD_SEED=0
WAIT_FOR_DB=1
```

Primeiro deploy manual no servidor:

```bash
docker compose -f compose.prod.yml build app
docker compose -f compose.prod.yml run --rm --no-deps -e RUN_FOOD_SEED=1 app true
docker compose -f compose.prod.yml up -d app
```

Healthcheck:

```bash
curl -fsS http://127.0.0.1:8000/health
```

## Deploy a partir da maquina de desenvolvimento

Pre-requisitos:

- o repositorio existe no servidor em `DEPLOY_PATH`;
- o servidor consegue acessar o remoto Git;
- Docker Compose esta instalado no servidor;
- `.env.production` existe no servidor e nao deve ser commitado.

Na sua maquina:

```bash
export DEPLOY_HOST='usuario@192.168.0.10'
export DEPLOY_PATH='/opt/fitness-tracker'
export DEPLOY_BRANCH='main'
export APP_HOST_PORT='8000'

scripts/deploy_production.sh
```

O script faz:

1. `git fetch` e `git pull --ff-only` no servidor;
2. build da nova imagem antes de substituir o container atual;
3. migrations em container one-off;
4. `docker compose up -d --no-deps app`;
5. checagem de `/health`.

## Sobre evitar quedas

O fluxo atual reduz risco, porque constroi a imagem antes de trocar o container e valida healthcheck depois.

Porem, com apenas um container servindo diretamente a porta da aplicacao, ainda pode existir uma pequena interrupcao durante a troca do container. Para disponibilidade mais proxima de ambiente real, a proxima evolucao deve ser:

- colocar um reverse proxy na frente, como Caddy ou Nginx;
- rodar duas instancias da app em portas internas diferentes;
- fazer estrategia blue/green;
- migrar o trafego para a nova instancia apenas depois do healthcheck passar;
- manter rollback rapido para a instancia anterior.

Enquanto o projeto ainda esta em MVP e rodando na rede local, o fluxo atual e suficiente para deploy controlado com baixa janela de indisponibilidade.

## Comandos uteis (producao)

Aplicar migrations e seed em producao:

```bash
RUN_FOOD_SEED=1 scripts/prod_migrate_and_seed.sh
```

Ver logs:

```bash
docker compose -f compose.prod.yml logs -f app
```

Reiniciar app:

```bash
docker compose -f compose.prod.yml up -d --no-deps app
```

Parar app:

```bash
docker compose -f compose.prod.yml stop app
```
