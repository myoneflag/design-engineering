export EnvName=stage
pushd docker && npm run login && npm run build:all --tagret=prod && npm run publish && popd
pushd cloudformation && npm run update && popd
