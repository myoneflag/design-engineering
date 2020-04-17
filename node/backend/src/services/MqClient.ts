import { Client, IFrame, IMessage, IPublishParams, StompHeaders, StompSubscription } from "@stomp/stompjs";
import CONFIG from "../config/config";
import uuid from 'uuid';
import retry from 'retry';
import { getManager } from "typeorm";

interface Subscription {
    destination: string;
    callback: (msg: IMessage) => any;
    stompSub: undefined | StompSubscription;
    headers?: StompHeaders;
}

export default class MqClient {
    static client: Client = new Client({
        brokerURL: CONFIG.MQ_URL,
        connectHeaders: {
            username: CONFIG.MQ_USERNAME,
            password: CONFIG.MQ_PASSWORD,
            login: CONFIG.MQ_USERNAME,
            passcode: CONFIG.MQ_PASSWORD,
            connectionTtl: "" + (30 * 60000),
        },
    });

    static subscriptions: {[key: string]: Subscription} = {};
    static nextSubIdNum: number = 1;
    static publishQueue: IPublishParams[] = [];
    static isPublishLoopRunning = false;

    static activate() {
        this.client.onConnect = this.onConnect.bind(this);
        this.client.onWebSocketClose = this.onWebsocketClose.bind(this);
        // this.client.debug = (msg) => console.log(msg);
        this.client.activate();
    }

    /**
     * Use this subscribe function as a wrapper to stompjs client's subscribe function. This is needed
     * Because stompjs client does not manage subscriptions for connects or reconnects. So, subscription is impossible
     * before connects, and reconnects wipe existing connections.
     * @param destination
     * @param callback
     * @param headers
     */
    static subscribe(destination: string, callback: (msg: IMessage) => any, headers?: StompHeaders): StompSubscription {
        const subId = "wrapper-sub-" + this.nextSubIdNum;
        this.nextSubIdNum ++;
        this.subscriptions[subId] = {destination, callback, stompSub: undefined, headers};

        if (this.client.connected) {
            this.subscriptions[subId].stompSub = this.client.subscribe(destination, callback, headers);
        }

        return {
            id: subId,
            unsubscribe: (unsubHeaders) => {
                if (this.subscriptions[subId] && this.subscriptions[subId].stompSub) {
                    this.subscriptions[subId].stompSub.unsubscribe(unsubHeaders);
                }

                delete this.subscriptions[subId];
            },
        };
    }

    static onWebsocketClose() {
        console.log("WARN: OnWebsocketClose called. Prior subscriptions would have been lost.");
    }

    static onConnect(receipt: IFrame) {
        for (const [subId, sub] of Object.entries(this.subscriptions)) {
            sub.stompSub = this.client.subscribe(sub.destination, sub.callback, sub.headers);
        }
        this.startPublishQueue();
    }

    /**
     * Use this publish function as a wrapper to stompjs client's publish function. This is needed
     * Because stompjs client does not manage publish actions for connects or reconnects. So, publish is impossible
     * before connects, and raise exceptions instead of buffering. Also, receipts automatically.
     * Note: Inserts its own receiptID if none are provided.
     * @param destination
     * @param callback
     * @param headers
     */
    static publish(params: IPublishParams) {
        this.publishQueue.push(params);
        this.startPublishQueue();
    }

    static async startPublishQueue() {
        if (this.isPublishLoopRunning) {
            return;
        }

        try {
            this.isPublishLoopRunning = true;

            while (this.publishQueue.length) {
                if (!this.client.connected) {
                    return;
                }

                const next = this.publishQueue.shift();
                await new Promise((res, rej) => {
                    const operation = retry.operation({randomize: true, minTimeout: 200, retries: 5});
                    operation.attempt(async () => {
                        if (!this.client.connected) {
                            // Disconnected while trying to send. Put it back and try again later.
                            this.publishQueue.unshift(next);
                            res();
                            return;
                        }

                        try {
                            this.client.publish(next);
                            res();
                        } catch (e) {
                            if (operation.retry(e)) {
                                return;
                            } else {
                                rej(e);
                            }
                        }
                    });

                });
            }
        } finally {
            this.isPublishLoopRunning = false;
        }
    }
}
