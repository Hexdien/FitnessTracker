# Contexto do projeto Fitness Tracker

Atualizado em: 2026-05-18

Este arquivo resume o estado atual do projeto para servir como memoria tecnica em proximas sessoes. Ele foi escrito a partir da leitura do codigo em `/home/hexdien/Projetos/fitness-tracker` e das notas do Obsidian em `/home/hexdien/Estudo/Cofre-Obsidian-Estudo/Tecnologia da Informação/Programação/Python/Projeto Saude e Bem estar`.

## Objetivo do projeto

O Fitness Tracker e um projeto pessoal para substituir anotacoes em Excel/n8n sobre dieta, treino e futuramente peso corporal. A ideia e transformar logs manuais em um sistema web com banco de dados, visualizacoes, historico consultavel e base para estudo de boas praticas de Python, Flask, banco de dados, automacao e seguranca ofensiva/defensiva.

Objetivos funcionais principais:

- registrar alimentos consumidos ao longo do dia;
- calcular macros e calorias a partir da quantidade consumida;
- acompanhar resumo diario de calorias, carboidratos, proteinas e lipidios;
- registrar sessoes de treino com exercicios, series, repeticoes e carga;
- futuramente registrar peso corporal, metas, dashboards e analises historicas.

Objetivos tecnicos e de estudo:

- aplicar arquitetura limpa o suficiente para um projeto Flask pequeno;
- usar SQLAlchemy e evoluir para PostgreSQL;
- adicionar autenticacao segura;
- praticar threat modeling, fuzzing, testes de abuso logico e documentacao de achados;
- criar automacoes com shell script para backup, deploy, monitoramento ou hardening.

## Estado atual do codigo

Stack atual:

- Python + Flask 3;
- SQLAlchemy 2;
- Alembic para migrations;
- SQLite por padrao (`sqlite:///fitness.db`);
- suporte configuravel a PostgreSQL por `DATABASE_URL` ou `USE_POSTGRES=1`;
- frontend simples servido pelo Flask com Jinja2, CSS e JavaScript puro;
- dependencias fixadas em `requirements.txt`.

Estrutura atual:

- `app/app.py`: factory `create_app`, registra blueprints e handlers de erro. `create_all` so roda com `AUTO_CREATE_TABLES=1`; o fluxo recomendado e Alembic.
- `app/config/config.py`: configuracao de banco via variaveis de ambiente.
- `app/database/db.py`: engine, `SessionLocal` e `Base`.
- `app/database/deps.py`: context manager `get_db`.
- `app/models/`: modelos SQLAlchemy.
- `app/routes/`: validacao HTTP, parse de payloads e serializacao.
- `app/services/`: regras de negocio e persistencia.
- `migrations/`: migrations Alembic.
- `scripts/seed_foods.py`: seed idempotente de alimentos reais e usuario local `id=1` para testes.
- `Dockerfile`, `compose.dev.yml`, `compose.prod.yml`: base de execucao em containers.
- `docs/producao.md`: fluxo operacional de producao no servidor local.
- `app/templates/index.html`: interface unica da aplicacao.
- `app/static/app.js`: chamadas fetch, estado local e renderizacao.
- `app/static/styles.css`: layout visual responsivo.

Nao existem testes automatizados no momento. Existem bancos SQLite locais (`fitness.db` e `app/fitness.db`) que estao ignorados pelo `.gitignore`.

## Modelos implementados

Nutrição:

- `Food`
  - `id`
  - `name` unico e obrigatorio
  - `base_quantity`, porcao base dos macros cadastrados
  - `calories`, `carbs`, `protein`, `lipids`
- `FoodLog`
  - `id`
  - `user_id`
  - `food_id`
  - `quantity`
  - macros calculados e persistidos no momento do log
  - `created_at` com UTC

Treino:

- `Exercise`
  - `id`
  - `name` unico
- `MuscleGroup`
  - `id`
  - `name` unico
- `ExerciseMuscleGroup`
  - relacao N:N entre exercicio e grupo muscular
  - constraint unica para evitar duplicidade da relacao
- `WorkoutSession`
  - `id`
  - `user_id`
  - `created_at`
- `ExerciseExecution`
  - exercicio executado dentro de uma sessao
  - `execution_order`
- `WorkoutSet`
  - serie dentro de uma execucao
  - `reps`, `weight`, `set_order`

Usuario:

- `Users`
  - `id`
  - `username` unico
  - `role` como string por enquanto
  - `created_at`

Ainda nao ha autenticacao real, login, senha, hash, sessoes ou JWT. As rotas usam `user_id = 1` fixo.

## Funcionalidades implementadas

### Alimentos e registros alimentares

Endpoints:

- `GET /food`
- `POST /food`
- `PUT /food/<food_id>`
- `PATCH /food/<food_id>`
- `DELETE /food/<food_id>`
- `GET /food-log?date=YYYY-MM-DD`
- `POST /food-log`
- `PUT /food-log/<food_log_id>`
- `PATCH /food-log/<food_log_id>`
- `DELETE /food-log/<food_log_id>`

Regras ja implementadas:

- payload deve ser JSON objeto;
- campos obrigatorios sao validados;
- strings sao normalizadas com `strip`;
- numeros nao podem ser booleanos;
- `Food` exige macros positivos;
- `FoodLog` exige `food_id` inteiro positivo e `quantity` positiva;
- `quantity` de food-log tem limite plausivel de 5000;
- macros do food-log sao recalculados ao criar/editar;
- nao permite excluir `Food` que ja possui `FoodLog`;
- listagem diaria filtra por intervalo UTC do dia informado.

Observacao de dominio: as notas dizem que macros do `FoodLog` devem ser derivados e preservados como snapshot historico. O codigo faz isso.

### Exercicios e sessoes de treino

Endpoints:

- `GET /exercise`
- `POST /exercise`
- `GET /workout-session?date=YYYY-MM-DD`
- `POST /workout-session`

Regras ja implementadas:

- exercicio exige nome e ao menos um grupo muscular;
- grupos musculares sao reaproveitados quando ja existem;
- remove duplicidade de grupos no payload por comparacao case-insensitive;
- sessao exige ao menos uma execucao;
- cada execucao exige `exercise_id` e ao menos uma serie;
- `reps` deve ser inteiro positivo;
- `weight` deve ser numerico nao negativo, permitindo peso corporal com `0`;
- sessoes sao listadas com exercicios, grupos musculares e series ordenadas.

Ainda nao ha edicao/exclusao de exercicios, sessoes, execucoes ou series.

### Frontend atual

A rota `/` renderiza uma interface unica com duas areas:

- Nutrição:
  - cadastro, edicao e exclusao de alimentos;
  - registro, edicao e exclusao de food-log;
  - filtro por data;
  - resumo diario de macros.
- Treino:
  - cadastro de exercicios com grupos musculares;
  - builder de sessao de treino com multiplos exercicios;
  - adicao/remocao dinamica de series;
  - listagem das sessoes do dia.

O JavaScript usa `fetch` diretamente contra a API Flask, mantem estado local em memoria e renderiza HTML por strings.

Ponto de atencao: varias renderizacoes inserem valores vindos do backend com `innerHTML` sem escape explicito. Como nomes de alimentos, exercicios e grupos musculares sao input do usuario, isso deve ser tratado antes de considerar a aplicacao segura contra XSS.

## Decisoes e invariantes vindas das notas

Invariantes de Food/FoodLog:

- `Food.name` deve ser unico;
- macros de `Food` deveriam aceitar zero segundo a modelagem, mas o codigo atual exige maior que zero;
- `FoodLog` sempre pertence a um usuario;
- `FoodLog.food_id` deve existir;
- `FoodLog.quantity > 0`;
- macros do log sao derivados do alimento e quantidade;
- historico deve ser preservado.

Invariantes de Workout:

- `WorkoutSession` pertence a um usuario;
- sessao precisa de data/hora;
- sessao precisa de ao menos uma execucao;
- execucao precisa de ao menos uma serie;
- serie precisa de ordem, repeticoes e peso;
- ordem de series deveria ser unica dentro da execucao, mas ainda nao ha constraint no banco;
- ordem de execucoes deveria ser unica dentro da sessao, mas ainda nao ha constraint no banco.

Funcionalidades planejadas mas ainda nao implementadas:

- autenticacao;
- metas de macros e peso;
- `WeightLog`;
- dashboards;
- historico por periodo;
- progressao de carga, volume total e PR automatico;
- logs/auditoria;
- automacoes n8n, Telegram/email ou shell scripts;
- versao vulneravel controlada para portfolio de seguranca;
- relatorios de pentest com CVSS.

## Riscos tecnicos atuais

Prioridade alta:

- `user_id = 1` fixo: impede isolamento real por usuario e mascara riscos de IDOR.
- Sem autenticacao/autorizacao: qualquer cliente local pode acessar e alterar tudo.
- Sem migrations: `Base.metadata.create_all` e util para MVP, mas nao controla evolucao de schema.
- Sem testes automatizados: aumenta risco de regressao nas validacoes e regras de negocio.
- Potencial XSS no frontend por uso de `innerHTML` com dados de usuario.
- Handlers genericos podem esconder erros importantes durante desenvolvimento; bom para cliente, ruim para diagnostico sem logging.

Prioridade media:

- Ausencia de constraints de unicidade para ordem de series/execucoes.
- Ausencia de limites para tamanho de strings, quantidade de exercicios por sessao e quantidade de series.
- Sem rate limit ou protecao contra spam/replay.
- Sem CSRF caso o projeto siga com formularios/cookies.
- Uso de `Numeric` sem precisao/escala explicita.
- Falta padronizacao centralizada de validacao; hoje ha validadores repetidos em rotas.

Prioridade baixa/agendada:

- Nome da classe `Users` poderia virar `User` para seguir convencao comum.
- Alguns arquivos `__init__.py` estao vazios, normal para agora.
- A UI e funcional, mas ainda tem padrao visual de MVP e pode ser refinada depois.

## Proximas melhorias recomendadas

Sequencia sugerida para evoluir com boas praticas:

1. Adicionar testes com `pytest`
   - testes unitarios dos services;
   - testes de API com Flask test client;
   - fixtures com SQLite temporario;
   - casos de input invalido, limites e duplicidade.

2. Introduzir migrations com Alembic/Flask-Migrate
   - remover dependencia de `create_all` como mecanismo principal;
   - versionar schema;
   - preparar migracao limpa para PostgreSQL.

3. Corrigir seguranca basica do frontend/API
   - escapar dados renderizados ou trocar renderizacao por criacao de DOM nodes;
   - definir limites de tamanho;
   - adicionar logging de erros;
   - revisar mensagens que facilitam enumeracao.

4. Implementar autenticacao
   - cadastro/login;
   - hash de senha com bcrypt/argon2;
   - sessao cookie segura ou JWT, escolhendo conscientemente;
   - substituir `user_id = 1` por usuario autenticado;
   - testar IDOR.

5. Completar modulo de treino
   - editar/excluir exercicio;
   - editar/excluir sessao;
   - observacoes por sessao;
   - volume total e historico por exercicio.

6. Implementar WeightLog e metas
   - peso diario com faixa plausivel;
   - meta de peso;
   - meta diaria de macros;
   - dashboard simples de progresso.

7. Criar automacoes
   - script de backup do banco;
   - script de health check da API;
   - script de fuzzing controlado;
   - script de smoke test local.

## Superficie de ataque ja mapeada nas notas

Casos importantes para testar:

- tipos errados: string, lista, objeto, boolean, null;
- campos faltando;
- campos extras;
- valores negativos;
- valores extremos;
- strings numericas;
- payloads hibridos como `"150; DROP TABLE"`;
- enumeracao por diferenca de status/body;
- duplicidade por replay;
- rate testing;
- race condition;
- IDOR quando houver usuarios reais;
- XSS em nomes de alimentos, exercicios e grupos musculares;
- abuso logico com muitas series/exercicios em uma unica sessao.

As notas indicam uma intencao clara: usar o projeto tambem como laboratorio de seguranca, documentando cenarios, deteccao, classificacao e impacto.

## Como rodar hoje

Instalacao esperada:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Banco padrao:

```text
sqlite:///fitness.db
```

Para PostgreSQL:

```bash
export DATABASE_URL='postgresql://usuario:senha@localhost:5432/fitness'
```

Ou:

```bash
export USE_POSTGRES=1
export DB_USER=postgres
export DB_PASSWORD='...'
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fitness
```

Fluxo recomendado com migrations:

```bash
venv/bin/alembic upgrade head
venv/bin/python scripts/seed_foods.py
venv/bin/flask --app app.app:create_app run
```

Reset de base de testes:

```bash
venv/bin/alembic downgrade base
venv/bin/alembic upgrade head
venv/bin/python scripts/seed_foods.py
```

O seed pode ser rodado varias vezes. Ele cria alimentos ausentes e atualiza alimentos existentes pelo nome. Enquanto a autenticacao real nao existe, ele tambem garante o usuario local `id=1`, usado pelas rotas atuais.

Escape hatch para desenvolvimento sem migrations:

```bash
AUTO_CREATE_TABLES=1 venv/bin/flask --app app.app:create_app run
```

## Skills recomendadas para configurar no Codex

Estas skills fariam sentido para este projeto:

1. `fitness-context`
   - Sempre ler `contexto.md`, `requirements.txt`, `app/app.py`, rotas, services e models relevantes antes de mexer no projeto.
   - Manter o foco em Flask, SQLAlchemy, seguranca e evolucao incremental.

2. `flask-api-quality`
   - Revisar endpoints Flask.
   - Checar status codes, validacao, serializacao, erros, transacoes e separacao route/service.
   - Sugerir testes com Flask test client.

3. `fitness-threat-model`
   - Manter uma lista de ativos, atores, superficies de ataque e cenarios.
   - Classificar achados por input validation, abuso logico, enumeracao, IDOR, XSS, CSRF e rate limit.
   - Gerar checklist ofensivo/defensivo por feature.

4. `api-fuzzer-local`
   - Criar e rodar fuzzers controlados contra endpoints locais.
   - Gerar payloads invalidos, extremos e concorrentes.
   - Registrar status code, body, tempo de resposta e possiveis inconsistencias.

5. `pytest-flask-sqlalchemy`
   - Criar fixtures de app e banco temporario.
   - Escrever testes unitarios e de integracao.
   - Garantir rollback/isolamento entre testes.

6. `db-migrations`
   - Introduzir Alembic/Flask-Migrate.
   - Criar migrations pequenas e revisaveis.
   - Evitar mudancas destrutivas sem plano de migracao.

7. `secure-auth-flask`
   - Implementar autenticacao com hash forte de senha.
   - Decidir entre cookie session e JWT.
   - Adicionar protecoes contra brute force, enumeracao e IDOR.

8. `frontend-security-review`
   - Revisar JavaScript e templates.
   - Procurar XSS, manipulacao insegura de DOM, falta de escape e UX que induz erro.

9. `shell-ops-fitness`
   - Criar scripts de backup, health check, smoke test, deploy local e hardening basico.
   - Documentar comandos operacionais do projeto.

Se for criar apenas uma primeira skill, a melhor candidata e `fitness-context`, porque ela reduz perda de contexto entre sessoes. A segunda mais valiosa e `pytest-flask-sqlalchemy`, porque o projeto esta entrando em uma fase onde testes vao proteger as regras de negocio e permitir evoluir com mais confianca.
