#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin


docker build -t stefanfcb94/musicplayer-logger-service:latest . 
docker push stefanfcb94/musicplayer-logger-service:latest
