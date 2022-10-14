# TogetherSeniorHealth server

## Run locally

### redis

Rhe easiest way on MacOS is to `brew install redis` and launch the service in the background.

### app

`yarn start:dev`

## Heroku dev deploy

- Download Heroku CLI (https://devcenter.heroku.com/articles/heroku-command-line)

- Do `heroku login`

- After `git clone` the repo, add Heroku remote

`git remote add heroku-mt1-api-dev https://git.heroku.com/mt1-api-dev.git`

- Then use `yarn deploy:dev`

Note - you must be logged in to Heroku for the command above work fine.

## Redis

We require redis to run to support multi-instance installations.

On Heroku `REDIS_URL` env variable is set automatically when you add Redis Add-on.
On other platforms we should take care of it platform-specific way.

### Pre-requisites

Heroku load balancer is started automatically when we scale the dynos (Professional or haigher level is required).

To allow Heroku load-balancer work correctly with web-sockets we need to apply config change as below (eg for TEST)

```shell
heroku features:enable http-session-affinity --remote heroku-mt1-api-test 
```

### Logging visibility

When using `heroku logs` eg like

```shell
 heroku logs --remote heroku-mt1-api-test -t
```

we see the source annotated as `app[web.1]:` - per instance. However, this does not work for LogDNA (question to Heroku support why).
