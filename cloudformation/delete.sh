set -e

cd cloudformation
npm install
npm run stack-exists
if [ $? -eq 0 ]; then
    npm run delete
fi
cd ..
