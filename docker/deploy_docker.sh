#!/bin/bash
docker stack rm h2x
docker-compose build
docker stack deploy -c docker-compose.yml h2x
