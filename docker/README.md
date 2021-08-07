# H2X Docker Developent and Build Commands

## Production build

```target=prod npm run build:all ```
* Build `prod-web` and `prod-worker` images

## Development

### Build

```target=dev npm run build:all```
* Build all development images: `backend`, `frontend`, `worker`, etc.

```target=dev npm run rebuild:all```
* Use this when performing changes to docker images that require rebuilding and not using cached layers. e.g. changing volumes

### Run

```npm run up```
* Start all development containers. Exist after containers are started.

```npm run down```
* Stops all development containers.

```service=[backend|frontend|worker|sqsd|...] npm run logs```
* Shows and follows logs for specified containers

```service=[backend|frontend|worker|sqsd|...] npm run restart```
* Restarts specified container
* Use when service crashes, or you make container changes like ports volumes, etc.

```service=[backend|frontend|worker|sqsd|...] npm run build```
* Rebuild specified container

```service=[backend|frontend|worker|sqsd|...] npm run exec```
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








