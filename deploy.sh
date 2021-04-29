pushd docker && npm run login && npm run build:all --target=prod && npm run publish && popd
pushd cloudformation && npm run update && popd
