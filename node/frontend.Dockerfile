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

workdir /usr/src/app/frontend

copy ./ ../
expose 8080
run npm run build
run npm install -g serve
env PORT 8080
cmd [ "serve", "--single", "./dist" ]
