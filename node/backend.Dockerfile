from node:12

workdir /usr/src/app/backend
copy ./backend/package*.json ./
run npm install

workdir /usr/src/app/frontend
copy ./frontend/package*.json ./
run npm install

workdir /usr/src/app/common
copy ./common/package*.json ./
run npm install

workdir /usr/src/app/backend

copy ./ ../
expose 8008
env PORT 8008
cmd [ "npm", "run", "dev" ]
