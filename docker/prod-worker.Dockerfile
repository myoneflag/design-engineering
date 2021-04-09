from node:12

run apt-get update
run apt-get upgrade -y
run apt-get install imagemagick ghostscript -y

add . /usr/src/app

workdir /usr/src/app/
run npm install

workdir /usr/src/app/backend
run npm install
run npm run build

expose 80
env PORT 80

# PRODUCTION
env MODE production
cmd [ "npm", "run", "start-worker" ]
