. ./config/.${ENV}.config

mkdir -p temp
export DOCIDS_FILE=temp/docIds_${ENV}.txt

curl --cookie "session-id=${SESSIONID}" ${LIST_API_URL} | jq ".data | .[] | select(.state == 0 and .organization.id != \"h2x\") | .id" > ${DOCIDS_FILE}

node scrape_results.js
