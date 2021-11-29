# Trigger document version upgrade process

This outlines the procedure of invokign the worker servers to perform the document version upgrade, usually right after a major web deployment.

## Manual steps

1. Log into AWS account
2. Navigate to SQS and identify the queue that corresponds to the environment you want to update. e.g. `h2x-worker-queue-stage`
3. Click `Send and receive message`
4. Use the following message body:
```json
{ "task": "DocumentUpgradeScan" }
```
Click Send message

To trigger the document upgrade of only one document, use the following message:
```json
{ "task": "DocumentUpgradeExecute", "params": { "docId": "${DOCUMENTID}" } }
```

5. Monitor upgrade process in Cloudwatch Log insights
```
https://us-west-1.console.aws.amazon.com/cloudwatch/home?region=us-west-1#logsV2:logs-insights
```

