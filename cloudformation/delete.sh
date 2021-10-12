set -e

cd cloudformation
npm install
if [![ $(npm run stack-exists) == *false ]]; then
    npm run delete
fi
cd ..
