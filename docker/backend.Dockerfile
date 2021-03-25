from node:12

run apt-get update
run apt-get upgrade -y
run apt-get install imagemagick ghostscript -y

add . /usr/src/app
workdir /usr/src/app
copy imagemagick-policy.xml /etc/ImageMagick-6/policy.xml
run npm install

workdir /usr/src/app/backend
run npm install

expose 80
env PORT 80

# PRODUCTION
# env MODE production
# cmd [ "npm", "run", "prod" ]

# DEVELOPMENT
run npm install -g nodemon ts-node
env MODE development
cmd [ "npm", "run", "dev" ]
