from node:12

run npm install -g serve

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
run npm run build
expose 80
env PORT 80
cmd [ "serve", "--single", "./dist" ]
