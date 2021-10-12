set -e

cd docker
npm install
npm run login:dockerhub
npm run login:aws
npm run build:all --target=prod
npm run publish
cd ..

cd cloudformation
npm install
exists=$(npm run stack-exists)
if [ "$exists" == "false" ]; then
    npm run create
else
    npm run update
fi
cd ..
