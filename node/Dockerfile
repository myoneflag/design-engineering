# For AWS Beanstalk - single docker instance.
from node:12


run apt-get install imagemagick -y
run apt-get update
run apt-get install ghostscript -y

workdir /usr/src/app/backend
copy ./backend/package*.json ./backend/npm*.json ./
run npm install

#NOTE: the frontend must be built as the dist directory is sent
# in zip and deployed directly. This is for performance.
#workdir /usr/src/app/frontend
#copy ./frontend/package*.json ./frontend/npm*.json ./
#run npm install

workdir /usr/src/app/
copy ./package*.json ./npm*.json ./
run npm install

copy ./ ./

workdir /usr/src/app/backend
expose 80
env PORT 80

env MODE production
cmd ["npm", "run", "prod"];
