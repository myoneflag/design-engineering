from h2x-base:latest

copy ./frontend/package*.json /usr/src/app/frontend/
workdir /usr/src/app/frontend/
run npm install

expose 8011
env PORT 8011

# DEVELOPMENT
cmd npm install && npm run serve
