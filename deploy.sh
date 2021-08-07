set -e

cd docker
npm install
npm run login:dockerhub
npm run login:aws
export target=prod 
npm run build:all
npm run publish

cd ../cloudformation
npm install
if [[ $(npm run stack-exists) == *false ]]; then
    npm run create
else
    npm run update
fi
cd ..