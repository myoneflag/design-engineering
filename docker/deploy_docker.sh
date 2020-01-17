#!/bin/bash
source ../aws_creds.sh
docker-compose build
docker-compose down
docker-compose up -d
