#!/bin/bash
source ../aws_creds.sh
docker stack rm h2x
docker-compose build
docker stack deploy -c docker-compose.yml h2x
