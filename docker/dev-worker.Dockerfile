from node:12

run apt-get update
run apt-get upgrade -y
run apt-get install imagemagick ghostscript -y

workdir /usr/src/app/backend
run npm install
run npm build

expose 80
env PORT 80

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd [ "npm", "run", "dev-worker" ]
