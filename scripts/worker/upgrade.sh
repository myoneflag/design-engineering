DOCID=$1
curl -X POST localhost:8013/workermessage \
    --max-time 300 \
    --header "Content-Type: application/json" \
    --data "{\"task\": \"documentUpgradeExecute\", \"parameters\": { \"docId\": \"${DOCID}\" } }"
echo Done