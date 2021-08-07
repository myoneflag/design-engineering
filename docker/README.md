# H2X Docker Developent and Build Commands

## Production build

```npm run build:all --target=prod```
* Build `prod-web` and `prod-worker` images

## Development

### Build

```npm run build:all --target=dev```
* Build all development images: `backend`, `frontend`, `worker`, etc.

```npm run rebuild:all --target=dev```
* Use this when performing changes to docker images that require rebuilding and not using cached layers. e.g. changing volumes

### Run

```npm run up```
* Start all development containers. Exist after containers are started.

```npm run down```
* Stops all development containers.

```npm run logs --service=[backend|frontend|worker|sqsd|...]```
* Shows and follows logs for specified containers

```npm run restart --service=[backend|frontend|worker|sqsd|...]```
* Restarts specified container
* Use when service crashes, or you make container changes like ports volumes, etc.

```npm run build --service=[backend|frontend|worker|sqsd|...]```
* Rebuild specified container

```npm run exec --service=[backend|frontend|worker|sqsd|...]```
* Opens a terminal in the specified container

### Troubleshooting

#### `Not enough space left on device`
* Increase Docker disk allocation in Docker Settings
* Use `docker prune` or "Clean Up" function in Docker desktop to delete unused volumes/cotainers

#### Timeout during build
* Try again

#### Container is killed with no error
* Likely insufficient memory
* Increase Docker memeory allocation in Docker Settings (default is 2GB)








