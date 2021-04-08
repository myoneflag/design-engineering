# For AWS Beanstalk - single docker instance
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
cmd [ "npm", "run", "prod" ]
