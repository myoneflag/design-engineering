from h2x-base:latest

copy ./frontend/package*.json /usr/src/app/frontend/
workdir /usr/src/app/frontend/
run npm install

expose 80
env PORT 80

# DEVELOPMENT
cmd [ "npm", "run", "serve" ]
