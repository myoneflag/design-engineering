# H2X WEB APP

## Documentation
First, check out the [documentation](./docs/README.md).

- [H2X WEB APP](#h2x-web-app)
  - [Documentation](#documentation)
  - [Clone source](#clone-source)
  - [Project structure](#project-structure)
    - [`node`](#node)
    - [`docker`](#docker)
    - [`cloudformation`](#cloudformation)
  - [Local development](#local-development)
    - [Install Docker](#install-docker)
    - [Overview](#overview)
  - [Docker modes `dev` and `minimal`](#docker-modes-dev-and-minimal)
    - [Run full docker dev environment: `dev`](#run-full-docker-dev-environment-dev)
    - [Run minimal docker dev environment: `minimal`](#run-minimal-docker-dev-environment-minimal)
  - [Local development on host `local`](#local-development-on-host-local)
  - [AWS credentials](#aws-credentials)
    - [Configure local environment with AWS](#configure-local-environment-with-aws)
  - [Start the app](#start-the-app)
  - [Worker (Optional)](#worker-optional)
    - [Worker commands](#worker-commands)
  - [VSCode configuration](#vscode-configuration)
    - [Useful plugins](#useful-plugins)
  - [Documentation](#documentation-1)
  - [Advanced](#advanced)
    - [Develop AWS Cloudformation stack (advanced)](#develop-aws-cloudformation-stack-advanced)
    - [Configure `local`, `dev` or `minimal` environment to use separate AWS resources (advanced)](#configure-local-dev-or-minimal-environment-to-use-separate-aws-resources-advanced)
    - [Production build (advanced)](#production-build-advanced)
- [Deployment scripts (advanced)](#deployment-scripts-advanced)

## Clone source

1. Request access to GitLab to H2X Admin
2. Set up SSH Keys and clone the repository
   
```
git clone git@gitlab.com:info892/H2X.git
cd H2X
git submodule update --init
```

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

### Install Docker
Install Docker Desktop for your host operating system.

### Overview
We can run local development in 3 modes: `dev` (in docker), `minimal` (in docker) and `local` (on host).  

| Mode | Service  | Runs on |
| ---- | -------- | ------- |
| dev  | backend  | docker  |
|      | frontend | docker  |
|      | worker   | docker  |
|      | db       | docker  |
|      | mq       | docker  |
|      | sqs      | docker  |
|      | sqsd     | docker  |
|      | nginx    | docker  |

| Mode    | Service  | Runs on |
| ------- | -------- | ------- |
| minimal | backend  | docker  |
|         | frontend | docker  |
|         | db       | docker  |
|         | mq       | docker  |
|         | nginx    | docker  |

| Mode  | Service  | Runs on  |
| ----- | -------- | -------- |
| local | backend  | **host** |
|       | frontend | **host** |
|       | db       | docker   |
|       | mq       | docker   |
|       | nginx    | docker   |

## Docker modes `dev` and `minimal`

Build base image: 
```
cd docker
npm run login:dockerhub
npm run build --service=base
```
Notes:  
* `npm run login:dockerhub` can be run only the first time you re setting up
* `npm run build --service=base` can be run only the first time, and when there are major changes to the installation process of the app. Usually rarely!

### Run full docker dev environment: `dev`

```
cd docker
npm run dev
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

### Run minimal docker dev environment: `minimal`

```
cd docker
npm run dev:minimal
```

This will not start `worker` and related services like `sqs`, `sqsd`.

## Local development on host `local`

This development mode will run the main parts of the app, `frontend`, `backend` and `worker` on the local machine, and will start docker containers only for DB, MQ and a Nginx proxy.

**Install dependencies**
On MacOS (using Homebrew): 
```
brew update
brew install imagemagick
brew install ghostscript
```

On Windows:
```
TBD
```

On Linux/Ubuntu:
```
apt-get update
apt-get install imagemagick ghostscript
```

**Start docker services**
1. ```
   cd docker
   npm run login:dockerhub
   npm run dev:local
   ```

### Start local servers
All commands to be executed on the host machine.

1. Ensure you use node 12  
   ```node --version```  
   If not, use `nvm` to install or switch to node 12.
2. Install TS
   ```
   npm install -g typescript vue-cli
   ```
2. Install common
   ```bash
   cd node
   npm install
   ```bash
3. Run backend
   ```bash
   cd node/backend
   npm install
   npm run dev
   ```
4. Run frontend
   ```bash
   cd node/frontend
   npm install
   npm run serve
   ```

**Developer code changes**

Both `frontend` and `backend` apps are started with hot reload enabled, for `local` or docker development.  
For `frontend` in case Vue hot reload does not work, uncomment `whatchOptions` configuration in [node/frontend/vue.config.js]().

## AWS credentials

1. Install the `aws-cli`
```
brew install awscli
```

1. You will be provided with an AWS Access Key and Secret Key for your local environment.
2. Create a local AWS profile that uses the AK, SK
```
aws configure --profile YOURNAME-h2x-testing
```
* AK, SK: provided
* default-region: `us-west-1`

For H2X admin:
1. Create a new IAM user in the H2X Testing account. 
e.g.    
2. Assign the new user to the `DeveloperLocal` group - this allows acces to S3 (pdf upload) and SES (email sending).  
3. Get the AK and SK generated for user.  
4. Send securely to the new user.

### Configure local environment with AWS

Using the AWS profile defined above, specify it as an environment variable before starting up the server environment so that the H2X backend uses the AWS credentials in the profile.

1. For `dev` and `minimal` docker development
```
export AWS_PROFILE=awsprofilename
cd docker
npm run dev
npm run dev:minimal
```

2. For `local` development
Define `node/backend/.env` file containing the following parameters:
And adjust the value of the AWS_PROFILE to one created above.

```bash
AWS_PROFILE=YOURNAME

# for email
SES_EMAIL_REGION=us-west-1
# for background uploads
PDF_BUCKET=h2x-s3-pdf-local
PDF_RENDERS_BUCKET=h2x-s3-pdfrenders-local
DATA_BUCKET=h2x-s3-data-local
REPORTS_BUCKET=h2x-s3-reports-local
# for Zapier
WEBHOOK_ZAPIER_CREATE_HUBSPOT_CONTACT=https://hooks.zapier.com/hooks/catch/10073114/b69cx4e

# Worker SQS queue
AWS_REGION=us-west-1
SQS_QUEUE_URL=http://sqs:9324/queue/h2x-worker-queue
DEBUG_SQS_ENDPOINT_URL=http://sqs:9324
DEBUG_SQS_SSL_ENABLED=false
```

Then run
```
cd node/backend
npm run dev
```

## Start the app

> The vue serve command will show the app URL as http://localhost:8011/  
> Frontend needs to be accessed from http://localhost:8010/

* Open your browser to http://localhost:8010. Log in with username "admin", and password "pleasechange".
* You will be shown a Example project - make a chane see if it works (top right Saving... label).
* Follow [this tutorial](https://www.youtube.com/playlist?list=PLIdFxhDHcGgwHcBSDr5L_9K3FKGlyzO1S) to learn to use the app.
* Create a new project, upload some PDF floorplans, add some elements and connect some pipes.  
  [PDF example files](https://drive.google.com/drive/folders/1DQc6Fs7Q1N_YwdhoGaYmkkVVEXxSj0ZK?usp=sharing).   
* Then, log out and create a new user.  
  Sign up with an email like `test+anything@h2xtesting.com`. This is our wildcard test email.  
* Ask you colleagues for the `test@h2xtesting.com` login credentials for future testing.

## Worker (Optional)

Run worker 
```bash
cd node/backend
npm run dev-worker
```

The worker server needs additionally 2 more docker containers running: `sqs` and `sqsd`.  
When running `dev` or `minimal`, these two containers are started automatically.  
When running `local`, they need to be configured and started manually:  

1. Add host entry for sqs: 
In `/etc/hosts` file
```
127.0.0.1   sqs
```

2. Adjust URLs in `docker-compose.yaml`
```
  sqsd:
    ...
    environment:
      # for local running worker
      - SQSD_WORKER_HTTP_URL=http://host.docker.internal:8013/workermessage
      # for dev or minimal running worker
      # - SQSD_WORKER_HTTP_URL=http://worker:80/workermessage
      ...
```

3. Start containers:
```bash
cd docker
npm run start --service=sqs
npm run start --service=sqsd
```

### Worker commands

On AWS, the Worker is being invoked by the SQSD Elastic Beanstalk daemon When messages are received in the SQS queue.  
Locally we can invoke the worker by placing messages in the local SQS instance.  

The worker is a Node.JS express server,with a separate router and acepting API calls on the `/workermessages` endpoint.
Code: 
* entry point: `node/backend/src/index-worker.ts`
* handler: `node/backend/src/controllers/worker.ts`

To issue worker commands locally, use the commands described in the `scripts/worker` [readme](scripts/worker/README.md).

## VSCode configuration

### Useful plugins
Go to VSCode > Extension and install all Recommended extensions.
More details TBD.

## Documentation

Checkout our more docs in the [docs/README.md](docs/README.md) table of contents.

## Advanced

### Develop AWS Cloudformation stack (advanced)

This refers to deveopment on the cloudformation stack and scripts for AWS resources being deployed.

Specify the name of the profile as the `AWS_PROFILE` env var before any commands you run
```
export AWS_PROFILE=awsprofilename
```

Main files: `template.json` and `parameters.json` in `cloudformation` folder.
Environment specific configs for deployment - `config` folder.

Validate changes:
```
cd cloudformation
export env=test
export AWS_PROFILE=awsprofilename
npm run validate
```

### Configure `local`, `dev` or `minimal` environment to use separate AWS resources (advanced) 

The local dev app uses S3 to store background files and images.
For that, a local configuration and a small AWS deployment needs to be performed.

1. Log into AWS Test account
2. Go to CloudFormation > Create Stack
3. Select Upload Template and select the `cloudformation/template-local.json` file
4. Use values:
   * Stack name: `h2x-stack-local-YOURNAME`
   * Environment name: `local-YOURNAME`


### Production build (advanced) 

This is a breakdown of the process. For a single line deployment, see below under `Deploy`.

Set environment
```
export env=stage
export AWS_PROFILE=awsprofile
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

# Deployment scripts (advanced) 
Executing a full docker build, and aws update with that build:

```
export env=test
export AWS_PROFILE=_awsprofile_
./deploy.sh
```
