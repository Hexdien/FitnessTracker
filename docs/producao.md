# Produção local com Docker Compose

Este projeto foi preparado para rodar em Docker Compose no servidor pessoal da rede local, usando um PostgreSQL que ja existe no servidor.

## Ambientes

### Desenvolvimento com Postgres em container

Use quando quiser testar localmente com um banco descartavel:

```bash
docker compose -f compose.dev.yml up --build
```

A app sobe em:

```text
http://127.0.0.1:5000
```

O `compose.dev.yml` cria um Postgres local, aplica migrations e roda o seed de alimentos automaticamente.

### Produção no servidor

O `compose.prod.yml` nao cria Postgres. Ele espera receber `DATABASE_URL` apontando para o PostgreSQL ja existente no servidor.

No servidor, crie `.env.production` a partir de `.env.example`:

```bash
cp .env.example .env.production
```

Exemplo minimo:

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

## Comandos uteis

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
