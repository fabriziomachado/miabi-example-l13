# Replicar do zero

Painel: <https://painel.miabi.unesc.net>. Cada ambiente é um workspace. O menu
Environments não entra.

| Workspace | GitOps | Pipeline | Host |
| --- | --- | --- | --- |
| **Miabi System** (id 1, handle `system`, registry `ws_1`) | ref `backup/miabi-system`, path `.miabi/envs/dev` | `laravel-example`, webhook de push desligado | <https://laravel-example.miabi.unesc.net> |
| **Develop** (handle `develop`) | ref `develop`, path `.miabi/envs/dev` | `miabil13`, branches `[develop]` | <https://miabil13-dev.miabi.unesc.net> |
| **production** (id 2, handle `production`, registry `ws_2`) | ref `main`, path `.miabi/envs/prod` | `miabil13`, branches `[main]` | <https://miabil13.miabi.unesc.net> |

Documentação da plataforma: <https://docs.miabi.io/docs/getting-started/introduction>.

Dois donos, e cada um fica com o seu:

| Quem | O quê |
| --- | --- |
| `.miabi/pipeline.yaml` | Testa, constrói a imagem e faz o deploy por digest. Em `main` escuta `main`; em `develop` escuta `develop`. |
| `.miabi/envs/dev/stack.yaml` | Banco, MinIO, rota `miabil13-dev`, env, healthcheck HTTP `/up:8080`, 2 réplicas Swarm. `source.ref: develop`. Não fixa tag nem digest. |
| `.miabi/envs/prod/stack.yaml` | O mesmo para production: rota `miabil13`, `source.ref: main`, Postgres dedicado. |
| Painel | App criada a partir do Git (é isso que adota o pipeline). Vault: `laravel-app-key`. |

A branch `backup/miabi-system` é o ponto de volta da app que está no System.
Não aponte o GitOps do System para `main` nem para `develop`.

## 0. O que não mexer no System

A app `laravel-example` continua no ar. O GitOps dela usa a branch
`backup/miabi-system`. O webhook do pipeline `laravel-example` no GitHub fica
inativo. Sem isso, um push em `main` ou `develop` volta a deployar essa app e
a publicar imagem em `ws_1`.

Deixe quietos os outros apps do System (react*, adminer, hello, autoscaler,
`laravel-git-detect`) e o MinIO `minio-1`.

## 1. Pré-requisitos

- Domínio `miabi.unesc.net` com wildcard. Não declare o domínio no manifesto. A verificação é exclusiva de um workspace: o System já é o dono. Em develop e production, registre o mesmo domínio (fica não verificado) e marque o workspace como privileged. Sem isso a rota não sai do estado offline, porque um segundo workspace não consegue provar a mesma zona.
- Registry do workspace ligado. A imagem fica em `ws_<id>` e também responde pelo handle (`system`, `develop`, `production`). Um token do workspace A não puxa o namespace do B.
- `docker login registry.miabi.unesc.net` usa o handle como usuário e um API token desse workspace como senha.
- Cluster Swarm com manager e pelo menos um worker, os dois `active`.
- Um runner que os dois workspaces possam usar. O runner do System é `scope: workspace` e não constrói job de outro workspace. O builder desta instalação é o runner compartilhado `wsl-builder` (`scope: shared`). O clone do pipeline precisa estar num diretório que o Docker do host enxerga (`MIABI_RUNNER_BUILDS_DIR` montado no container do runner).

## 2. Copiar só o MinIO

A app Laravel não se copia entre namespaces: cada pipeline constrói o commit da própria branch. O MinIO não passa pelo pipeline. A imagem que já está em `system` é copiada uma vez para cada workspace novo:

```
registry.miabi.unesc.net/system/minio:release-2025-09-07
  → registry.miabi.unesc.net/develop/minio:release-2025-09-07
  → registry.miabi.unesc.net/production/minio:release-2025-09-07
```

Apontar develop ou production para `ws_1/minio` faz o pull falhar. Docker Hub também não serve `minio/minio` neste cluster.

## 3. Workspace develop

1. Criar o workspace, handle `develop`, display Develop. Marcar privileged (admin), porque a zona `miabi.unesc.net` já está verificada no System e a plataforma não deixa um segundo workspace verificá-la. Em **Domains**, registrar `miabi.unesc.net` wildcard, TLS acme. Não precisa de um TXT novo.
2. **Sources → Git Repositories.** URL `https://github.com/fabriziomachado/miabi-example-l13.git`. O repositório é público.
3. **Sources → Secrets.** Criar `laravel-app-key` com `php artisan key:generate --show` (formato `base64:`). Não reutilizar a chave do System nem a de production. Não colocar `generate: true` nesse secret.
4. Copiar a imagem do MinIO para `develop/minio:release-2025-09-07` (seção 2).
5. **Applications → New**, origem Git, nome `miabil13`, branch `develop`, Dockerfile, porta `8080`. Criar por Git é o que adota `.miabi/pipeline.yaml`.
6. **GitOps → New source:** repositório acima, ref `develop`, path `.miabi/envs/dev`, sync **automatic**, prune **ligado**, self-heal **ligado**. Abrir o diff e sincronizar.
7. No pipeline `miabil13`, copiar o webhook e no GitHub **Settings → Webhooks** criar um hook só desse payload (content type `application/json`, evento push). Não reativar o webhook do pipeline `laravel-example` do System.
8. Com o MinIO no ar, criar o bucket `laravel`.

O sync cria o banco, o volume `minio-data`, o secret `minio-root-password`, o MinIO em 1 réplica e a rota `miabil13-dev.miabi.unesc.net`. A app sobe com 2 réplicas, sem volume e sem prender nó.

## 4. Workspace production

O workspace `production` (id 2) já existe. Ele também precisa ser privileged e ter o domínio `miabi.unesc.net` registrado (não verificado). Repetir a seção 3 com:

- outra `laravel-app-key`
- imagem em `production/minio:release-2025-09-07` (namespace `ws_2`)
- app Git na branch `main`
- GitSource ref `main`, path `.miabi/envs/prod`
- outro webhook de push, o do pipeline deste workspace

Não criar esse GitSource dentro do Miabi System.

## 5. O que tem que passar

- Push em `develop`: pipeline do workspace develop verde, imagem em `ws_<id>/miabil13`, `https://miabil13-dev.miabi.unesc.net/` e `/up` com HTTP 200.
- Push em `main`: o mesmo em `ws_2/miabil13` e em `https://miabil13.miabi.unesc.net/`.
- Nas duas apps, as 2 tasks em nós diferentes (uma no manager, uma no worker). Se as duas caírem no mesmo nó, conferir se o outro está `active` (não `pause` nem `drain`). Não pinar hostname.
- O push de uma branch não cria deployment na app do outro workspace. Se criar, o webhook que disparou errado sai.
- `https://laravel-example.miabi.unesc.net/` continua 200, imagem ainda em `ws_1`.
- Dentro de um container da app, gravar e ler um objeto no disco `s3` (bucket `laravel`). As duas réplicas usam o mesmo bucket.
