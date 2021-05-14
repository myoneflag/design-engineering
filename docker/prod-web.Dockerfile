# For AWS Beanstalk - single docker instance
from h2x-base:latest

workdir /usr/src/app/backend
run npm install
run npm run build

# /dist directory built
workdir /usr/src/app/frontend
run npm install
run npm run build

expose 80
env PORT 80

# PRODUCTION
workdir /usr/src/app/backend
env MODE production
cmd [ "npm", "run", "start" ]
