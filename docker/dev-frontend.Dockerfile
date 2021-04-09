from node:12

run apt-get update
run apt-get upgrade -y

add . /usr/src/app
workdir /usr/src/app
run npm install

workdir /usr/src/app/frontend
run npm install

expose 80
env PORT 80

# DEVELOPMENT
cmd [ "npm", "run", "serve" ]
