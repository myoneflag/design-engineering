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

### `cloudformation`
This contains the `template.json` AWS Cloudformation template, that creates all resources for deploying a new environment.  
Also, is updates an existing environment with new Docker images that have been pushed after a production build.

## Local development

This development mode will run the main parts of the app, `frontend`, `backend` and `worker` on the local machine, and will start docker containers only for DB, MQ and a Nginx proxy.

**Start local servers**
1. Ensure you use node 12  
   ```node --version```  
   If not, use `nvm` to install or switch to node 12.
2. cd h2x
3. ```
   npm install -g typescript vue-cli
   ```
4. ```
   cd node/backend
   npm install
   npm run dev
   ```
5. *(optional, in a new terminal)*
   ```
   npm run dev-worker
   ```
6. ```
   cd ../frontend
   npm install
   npm run serve
   ```
**Start docker services**
1. ```
   cd docker
   npm run dev:local
   ```

## Local development inside of Docker

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

You can also run a minimal set of docker containers:
```
npm run dev:minimal
```

## AWS Development

Issue AK, SK for your IAM user. Create local AWS profile using:
```
aws configure --profile awsprofile
```

Main files: `template.json` and `parameters.json` in `cloudformation` folder.
Envvironment specific configs for deployment - `config` folder.

Validate changes:
```
cd cloudformation
export env=test
export profile=awsprofile
npm run validate
```

### Production build

This is a breakdown of the process. For a single line deployment, see below under `Deploy`.

Set environment
```
export env=stage
export profile=awsprofile
```

Prep and build docker
```
cd docker
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

# Deployment scripts
Executing a full docker build, and aws update with that build:

```
export env=test
export profile=awsprofile
./deploy.sh
```
