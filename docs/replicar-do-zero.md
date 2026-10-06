# Replicar do zero

Passo a passo para publicar esta app (Laravel 13 + Inertia/React) no Miabi e
testar de novo. Painel deste ambiente: <https://painel.miabi.unesc.net>,
workspace **Miabi System**. URL pública:
<https://laravel-example.miabi.unesc.net>.

Documentação da plataforma: <https://docs.miabi.io/docs/getting-started/introduction>
(pipelines, GitOps e a referência do manifesto).

Dois donos, e cada um fica com o seu:

| Quem | O quê |
| --- | --- |
| `.miabi/pipeline.yaml` | Testa, constrói a imagem e faz o deploy por digest a cada push em `main` |
| `.miabi/envs/dev/stack.yaml` | Banco, rota, env, healthcheck HTTP `/up:8080`, 2 réplicas Swarm. Não fixa tag nem digest. Secrets só por nome (`{{ .secrets.* }}`) |
| Painel | App criada a partir do Git (é isso que adota o pipeline). Vault: `laravel-app-key` e `minio-root-password` |

`.miabi/envs/prod/stack.yaml` é o arquivo de promoção para **outro** workspace.
Não crie um GitSource nele aqui: os nomes batem com os de dev de propósito.

## 0. Apagar só esta app, se for um reteste

Pare e apague a application `laravel-example`. A rota e o pipeline dela saem
junto. Apague o GitSource `.miabi/envs/dev` e o banco lógico `laravel_db`.

Deixe quietos os outros apps (react*, adminer, hello, autoscaler,
`laravel-git-detect`), o volume `test` e o MinIO, se for reutilizar o mesmo.

## 1. Pré-requisitos

- Domínio `miabi.unesc.net` verificado, com wildcard. Não declare o domínio no manifesto.
- Registry do workspace ligado.
- Cluster Swarm com manager e pelo menos um worker.
- Um runner online. O clone do pipeline precisa estar num diretório que o
  Docker do host enxerga (`MIABI_RUNNER_BUILDS_DIR` montado no container do
  runner). Sem esse mount, o passo `test-php` não acha o `composer.json`.
- MinIO no ar na rede do workspace, com o bucket `laravel`. Anote o alias
  interno da app (`mb-app-…`). As duas réplicas falam com ele por esse nome,
  na porta 9000, path-style.

Se o deploy do template MinIO falhar com `pull access denied for minio/minio`,
a imagem saiu do Docker Hub. Aponte a app para uma cópia que o cluster consiga
puxar, no registry do workspace (`registry…/ws_<id>/minio:<tag>`).

## 2. No painel, antes do GitOps

1. **Sources → Git Repositories.** URL
   `https://github.com/fabriziomachado/miabi-example-l13.git`. O repositório é
   público.
2. **Applications → New**, origem Git, nome `laravel-example`, branch `main`,
   build Dockerfile, porta `8080`. Criar por Git é o que adota
   `.miabi/pipeline.yaml`. Aplicar o manifesto não liga o pipeline.
3. **Sources → Secrets.** Crie (ou reutilize) `laravel-app-key` com
   `php artisan key:generate --show`, e `minio-root-password` com a senha
   root do MinIO que já está no ar. Não cole nenhum dos dois no Git.

## 3. Ajustar o manifesto e sincronizar

Em `.miabi/envs/dev/stack.yaml`, `AWS_ENDPOINT` e `AWS_URL` são o alias do
MinIO desta instalação, por exemplo `http://mb-app-……:9000`.
`APP_KEY` e `AWS_SECRET_ACCESS_KEY` apontam para o vault
(`{{ .secrets.laravel-app-key }}`, `{{ .secrets.minio-root-password }}`).
O `healthcheck` HTTP `/up:8080` já está no manifesto. Commit e push em `main`.

**GitOps → New source:**

- repositório acima, ref `main`, path `.miabi/envs/dev`
- sync **automatic**, prune **ligado**, self-heal **ligado**

Abra o diff e sincronize. O sync cria o banco lógico `laravel_db` (em cima de
um Postgres compatível que já exista), a rota
`laravel-example.miabi.unesc.net`, o healthcheck e sobe a app como serviço
Swarm com 2 réplicas, sem volume e sem prender nó. Não há storage
compartilhado neste cluster; um volume local obrigaria as duas tasks a caírem
no mesmo nó.

Se o sync falhar com `unknown secret`, o vault ainda não tem um dos nomes
acima. Crie o secret e sincronize de novo. O self-heal não apaga o valor:
o Git só declara o nome.

## 4. Pipeline

**Pipelines → laravel-example → Run** (branch `main`), enquanto o webhook não
estiver no GitHub. Os quatro passos são `test-php`, `test-frontend`, `build`,
`deploy`. O `uses: deploy` publica a imagem por digest. Não copie a tag
`run-<n>` para o `.miabi/envs/dev`.

Para o push disparar sozinho: no pipeline, o ícone de webhook, e no GitHub
**Settings → Webhooks**, evento push, content type `application/json`.

## 5. O que tem que passar

- Os quatro passos do pipeline verdes, e uma tag nova em **Container Registry**.
- App `running`, runtime service, 2 réplicas, uma task no manager e outra no worker.
- `curl -sI https://laravel-example.miabi.unesc.net/` e `…/up` com HTTP 200.
- Dentro de um container da app, gravar e ler um objeto no disco `s3`
  (bucket `laravel`). As duas réplicas usam o mesmo bucket, então o arquivo
  não depende do nó.

`.miabi/envs/prod` continua sem GitSource. Promover é outro workspace: tire o
`uses: deploy` de lá e grave o `$MIABI_IMAGE_DIGEST` no manifesto de prod.
