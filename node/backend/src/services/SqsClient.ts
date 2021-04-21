import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import { convertPipeDiameterFromMetric } from "../../../common/src/lib/measurements";
import Config from '../config/config'

export default class SqsClient {

    static client = new SQSClient(this.clientConfig());

    static clientConfig() { 
        const config = {}
        if (Config.DEBUG_SQS_QUEUE_URL)
            config.endpoint = Config.DEBUG_SQS_QUEUE_URL
        if (Config.DEBUG_SQS_SSL_ENABLED)
            config.tls = Config.DEBUG_SQS_SSL_ENABLED
        return config;
    }

    static async publish(message) {
        const sendParams = {
            QueueUrl: Config.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message)
        }
        const sendResult = await this.client.send(new SendMessageCommand(sendParams))
        console.log("SQS Message sent " + sendResult.MessageId)
    }
}
