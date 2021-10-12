set -e

cd cloudformation
npm install
exists=$(npm run stack-exists)
if [ "$exists" == "false" ]; then
    echo "Stack does not exist"
else
    npm run delete
fi
cd ..
