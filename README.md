# H2X WEB APP

## Project structure

### `node`
* `frontend` - Vue.JS app
* `backend` - Node.JS app, with 2 entrypoints
    * `src/index.js` - web app exposing APIs and websockets
    * `src/index-worker.js` - worker app listening to messages from SQS exposed as API endpoint at `/workermessage`  
    For more details see details about [ElasticBeanstalk workers](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features-managing-env-tiers.html)

### `docker`
* `docker-compose` is used to bring up local development containers, and to build production containers

### Local development

```
cd docker
npm run dev
```
This runs:
```
docker-compose --profile dev up
```
This will start the following containers:
* Node.JS webserver container `frontend` for the frontend Vue app  
This runs in the `frontend` folder `npm run serve` - Vue CLI dev server with hot reload
* Node.JS webserver container `backend` for the backend API  
This runs in the `backend` folder `npm run dev` - dev server with hot reload
* Node.JS webserver container `worker` for the worker web app  
This also runs in the `backend` folder `npm run dev-worker` - dev server with hot reload
* start a Postgres DB container `db`
* start a ActiveMQ broker container `mq`
* start a NGinx container `nginx`  
This runs NginX that exposes all 3 webservers (configured default for port *80*) to serve over 8011,8012,8013 to avoid port 80 conflicts

### Production build

```
cd docker
export env=stage
```

Login into ECR - uses the configured AWS Profile to obtain *docker login* credentials.
```
npm run login
```

To build and push the docker images:
```
npm run build
npm run publish
```
This will:
* build the production version of the *backend+frontend* as `prod-web` and the *worker* as `prod-worker` by invoking `docker-compose --profile prod build`
* tags the last local images
* pushes them to ECR
* creates descriptor files for the Cloudformation ElasticBeanstalk update.

### `cloudformation`
This contains the `template.json` AWS Cloudformation template, that creates all resources for deployign a new environment.  
Also, is updates an existing environment with new Docker images that have been pushed after a production build.

```
cd cloudformation
export env=stage
npm run update
```

### Others

* `java` folder - obsolete
* `catalog` folder - obsolete
* `backup` folder - redundant

# Deployment scripts
```
export env=stage
pushd docker && npm run build && npm run publish && popd
pushd cloudformation && npm run update && popd
```
