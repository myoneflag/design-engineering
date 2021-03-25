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

# PRODUCTION 
# run npm install -g serve
# run npm run build
# cmd [ "serve", "--single", "./dist" ]

# DEVELOPMENT
cmd [ "npm", "run", "serve" ]
