export EnvName=stage
pushd docker && npm run login && npm run build-worker && npm run publish && popd
pushd cloudformation && npm run update && popd
