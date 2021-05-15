# For AWS Beanstalk - single docker instance
from h2x-base:latest

copy ./common /usr/src/app/common

copy ./ormconfig.js /usr/src/app/

copy ./backend /usr/src/app/backend
workdir /usr/src/app/backend
run npm install
run npm run build

# /dist directory built
copy ./frontend /usr/src/app/frontend
workdir /usr/src/app/frontend
run npm install
run npm run build

expose 80
env PORT 80

# PRODUCTION
workdir /usr/src/app/backend
env MODE production
cmd [ "npm", "run", "start" ]
