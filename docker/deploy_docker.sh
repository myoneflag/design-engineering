#!/bin/bash
source ../aws_creds.sh
docker-compose down
docker-compose build
docker-compose up -d
