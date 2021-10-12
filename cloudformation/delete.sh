set -e

cd cloudformation
npm install
exists=$(npm run stack-exists)
if [ "$exists" == "true" ]; then
    npm run delete
else
    echo "Stack does not exist"
fi
cd ..
