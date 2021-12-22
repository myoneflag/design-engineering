set -e

cd docker
npm install
npm run login:dockerhub
npm run login:aws
npm run build:all --target=prod
npm run copy-web-assets
npm run publish
cd ..

cd cloudformation
npm install
if [ "$(npm run --silent stack-exists)" = "false" ]
then
    npm run create    
else    
    npm run update
fi
cd ..