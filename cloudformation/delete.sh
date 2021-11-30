set -e

cd cloudformation
npm install
if [ "$(npm run --silent stack-exists)" == "false" ]
then
    echo "Stack does not exist"
else
    echo "Stack will be deleted"
    npm run delete
fi
cd ..
