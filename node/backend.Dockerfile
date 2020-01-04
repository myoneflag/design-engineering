from node:12

run apt-get install imagemagick -y
run apt-get update
run apt-get install ghostscript -y

workdir /usr/src/app/backend
copy ./backend/package*.json ./
run npm install

workdir /usr/src/app/frontend
copy ./frontend/package*.json ./
run npm install

workdir /usr/src/app/common
copy ./common/package*.json ./
run npm install

workdir /usr/src/app/backend

copy ./ ../
copy imagemagick-policy.xml /etc/ImageMagick-6/policy.xml
expose 8008
env PORT 8008

# because we run in dev mode because we don't know how to get it 
# to compile in prod :'(
env H2X_MODE production

cmd [ "npm", "run", "dev" ]
