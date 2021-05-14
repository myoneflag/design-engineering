from node:12

run apt-get update
run apt-get upgrade -y
run apt-get install imagemagick ghostscript -y

add . /usr/src/app
workdir /usr/src/app
copy imagemagick-policy.xml /etc/ImageMagick-6/policy.xml
run npm install
