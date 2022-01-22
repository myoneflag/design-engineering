if [ -z "${ENV}" ] || [ -z "${USERNAME}" ] || [ -z "${PASSWORD}" ]; then
    echo Values not defined
    echo "export ENV=[local|test|stage|prod]"
    echo "export USERNAME=..."
    echo "export PASSWORD=..."
    exit 1
fi

. ./config/.${ENV}.config

export LIST_API_URL=${APP_DOMAIN}/api/documents/
export LOGIN_API_URL=${APP_DOMAIN}/api/login/
export DOCUMENT_URL=${APP_DOMAIN}/document/DOC_ID/2/

export SESSIONID=`curl -X POST -H "Content-Type: application/json" ${LOGIN_API_URL} -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" | jq -r .data`
echo sessionid ${SESSIONID}

if [ "${SESSIONID}" == "null" ]; then
    echo Login failed
    exit 1
fi

mkdir -p temp
export DOCIDS_FILE=temp/docIds_${ENV}.txt

curl --cookie "session-id=${SESSIONID}" ${LIST_API_URL} | jq ".data | .[] | select(.state == 0 and .organization.id != \"h2x\") | .id" > ${DOCIDS_FILE}

node crawl.js
