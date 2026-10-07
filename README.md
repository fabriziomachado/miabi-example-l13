# miabi-example-l13

Laravel 13 com uma página React + Inertia.js, usada para exercitar o exemplo
Laravel do Miabi.

A imagem escuta na porta **8080**. O Miabi termina o TLS e sonda `/up`.
Runtime (`APP_KEY`, `DB_*`, `SSL_MODE`, `AUTORUN_*`) vem do ambiente da
aplicação, não desta imagem.

Três workspaces, cada um com o seu registry (`registry.miabi.unesc.net`):

| Workspace | Handle | Branch | Host |
| --- | --- | --- | --- |
| Miabi System | `system` (`ws_1`) | `backup/miabi-system` | <https://laravel-example.miabi.unesc.net> |
| Develop | `develop` | `develop` | <https://miabil13-dev.miabi.unesc.net> |
| production | `production` (`ws_2`) | `main` | <https://miabil13.miabi.unesc.net> |

A app que já funcionava no System não foi renomeada. O GitOps dela aponta para
`backup/miabi-system` e o webhook do pipeline `laravel-example` está desligado,
para um push em `main` ou `develop` não voltar a publicar imagem em `ws_1`.

`develop` e `production` sobem a app `miabil13` como serviço Swarm com 2
réplicas, sem prender nó. O MinIO fica em 1 réplica, com volume, no namespace
do próprio workspace. O passo a passo do painel está em
[docs/replicar-do-zero.md](docs/replicar-do-zero.md).
