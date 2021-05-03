pushd docker && npm run login && npm run build:all --target=prod && npm run publish && popd
pushd cloudformation
if [[ $(npm run stack-exists) == *false ]]; then
    npm run create
else
    npm run update
fi
popd