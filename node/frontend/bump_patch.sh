# MMM.mmm.ppp
# use below `major`, `minor` or `patch`
version=`npm version patch`
sed -i '' "s/const LATEST_VERSION = \"[^\"]*\"/const LATEST_VERSION = \"$version\"/g" service-worker.js
echo $version
