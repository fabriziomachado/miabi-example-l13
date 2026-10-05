# miabi-example-l13

Laravel 13 application with a React + Inertia.js page, built to exercise the
Miabi Laravel example (`examples/laravel-inertia` in the platform repository).

The image listens on port **8080**. Miabi terminates TLS and probes `/up`.
Runtime settings (`APP_KEY`, `DB_*`, `SSL_MODE`, `AUTORUN_*`) come from the
application environment, not from this image.

Live at <https://laravel-example.miabi.unesc.net>. The panel steps used to
publish it are in [docs/deploy-no-painel-miabi.md](docs/deploy-no-painel-miabi.md).

GitOps manifests, adapted from the platform's `examples/laravel-inertia`, are
in `envs/dev/stack.yaml` and `envs/prod/stack.yaml`.
