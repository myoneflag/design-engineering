from node:12

run apt-get update && apt-get upgrade -y && apt-get install imagemagick ghostscript -y

copy imagemagick-policy.xml /etc/ImageMagick-6/policy.xml
copy package*.json /usr/src/app/
workdir /usr/src/app/
run npm install
