from node:12

run apt-get install imagemagick -y
run apt-get update
run apt-get install ghostscript -y


workdir /usr/src/app/backend
copy ./backend/package*.json ./backend/npm*.json ./
run npm install

workdir /usr/src/app/frontend
copy ./frontend/package*.json ./frontend/npm*.json ./
run npm install

workdir /usr/src/app/
copy ./package*.json ./npm*.json ./
run npm install
workdir /usr/src/app/backend

copy ./ ../
copy imagemagick-policy.xml /etc/ImageMagick-6/policy.xml
expose 80
env PORT 80

# because we run in dev mode because we don't know how to get it
# to compile in prod :'(
env MODE production

cmd [ "npm", "run", "prod" ]
