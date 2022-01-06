set -e

if [ "$env" == "prod" ] || [ "$env" == "stage" ] || [ "$env" == "test" ]
then    
    echo $env "environment cannot be delete"
else
    echo $env "stack will be deleted"
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
fi
