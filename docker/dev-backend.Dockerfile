from h2x-base:latest

copy ./backend/package*.json /usr/src/app/backend/
workdir /usr/src/app/backend/
run npm install

expose 8012
env PORT 8012

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd npm install && npm run dev
