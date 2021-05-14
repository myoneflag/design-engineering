from h2x-base:latest

workdir /usr/src/app/backend
run npm install

expose 80
env PORT 80

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd [ "npm", "run", "dev" ]
