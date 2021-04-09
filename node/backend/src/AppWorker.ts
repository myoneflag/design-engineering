import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import expressWs from "express-ws"; // Avoid import rearrangement in this file - express-ws needs to be after express.
import CONFIG from './config/config';

// for StompJS
Object.assign(global, { WebSocket: require('ws') });

const expressApp = expressWs(express(), undefined, {
    wsOptions: {
        perMessageDeflate: {
            zlibDeflateOptions: {
                // See zlib defaults.
                chunkSize: 1024,
                memLevel: 7,
                level: 3
            },
            zlibInflateOptions: {
                chunkSize: 10 * 1024
            },
            // Other options settable:
            clientNoContextTakeover: true, // Defaults to negotiated value.
            serverNoContextTakeover: true, // Defaults to negotiated value.
            serverMaxWindowBits: 10, // Defaults to negotiated value.
            // Below options specified as default values.
            concurrencyLimit: 10, // Limits zlib concurrency for perf.
            threshold: 1024 // Size (in bytes) below which messages
            // should not be compressed.
        }
    }
}).app;

import routerWorker from "./router-worker";
import * as errorHandler from "./helpers/errorHandler";
import * as path from "path";
import MqClient from "./services/MqClient";
import { DocumentUpgrader } from "./services/DocumentUpgrader";

class AppWorker {
    public express: expressWs.Application;

    constructor() {
        this.express = expressApp;
        this.setMiddlewares();
        this.setWebsockets();
        this.setMqServices();
        this.setRoutes();
        this.catchErrors();

    }

    private setWebsockets() {
        // No op
    }

    private setMqServices() {
        MqClient.activate();
    }

    private setMiddlewares(): void {
        this.express.use(cors());
        this.express.use(morgan("dev"));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(helmet());
    }

    private setRoutes(): void {
        this.express.use("/", routerWorker);
    }

    private catchErrors(): void {
        this.express.use(errorHandler.notFound);
        this.express.use(errorHandler.internalServerError);
    }
}

export default new AppWorker().express;


