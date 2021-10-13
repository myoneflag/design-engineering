set -e

cd cloudformation
npm install
if [[ "$(npm run stack-exists)" == *false ]]; then
    echo "Stack does not exist"
else
    npm run delete
fi
cd ..
