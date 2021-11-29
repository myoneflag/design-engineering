import AWS from "aws-sdk";
import Config from '../config/config';

export default class SqsClient {

    static client = new AWS.SQS(SqsClient.clientConfig());

    static clientConfig() {
        if (Config.DEBUG_SQS_ENDPOINT_URL && Config.DEBUG_SQS_SSL_ENABLED) {
            const config = {
                endpoint: Config.DEBUG_SQS_ENDPOINT_URL,
                tls: Config.DEBUG_SQS_SSL_ENABLED,
            };
            return config;
        }
        return {};
    }

    static async publish(message) {
        const sendParams = {
            QueueUrl: Config.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message),
        };
        const sendResult = await this.client.sendMessage(sendParams).promise();
        console.log("SQS Message sent " + sendResult.MessageId);
    }

    static async estimateNumberOfMessages(): Promise<number> {
        const attributes = await this.client.getQueueAttributes({
            QueueUrl: Config.SQS_QUEUE_URL,
            AttributeNames: ["ApproximateNumberOfMessagesNotVisible", "ApproximateNumberOfMessages"],
        }).promise();
        return parseInt(attributes.Attributes.ApproximateNumberOfMessages, 10) +
            parseInt(attributes.Attributes.ApproximateNumberOfMessagesNotVisible, 10);
    }
}
