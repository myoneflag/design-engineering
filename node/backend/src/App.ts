import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import expressWs from 'express-ws';

const expressApp = expressWs(express(), undefined, {
    wsOptions: {
        perMessageDeflate: {
            zlibDeflateOptions: {
                // See zlib defaults.
                chunkSize: 1024,
                memLevel: 7,
                level: 3,
            },
            zlibInflateOptions: {
                chunkSize: 10 * 1024,
            },
            // Other options settable:
            clientNoContextTakeover: true, // Defaults to negotiated value.
            serverNoContextTakeover: true, // Defaults to negotiated value.
            serverMaxWindowBits: 10, // Defaults to negotiated value.
            // Below options specified as default values.
            concurrencyLimit: 10, // Limits zlib concurrency for perf.
            threshold: 1024, // Size (in bytes) below which messages
            // should not be compressed.
        },
    },
}).app;

import apiV1 from './router';
import * as errorHandler from './helpers/errorHandler';
import cookieParser from "cookie-parser";
import {withAuth} from "./helpers/withAuth";


class App {
  public express: expressWs.Application;

  constructor() {
    this.express = expressApp;
    this.setMiddlewares();
    this.setWebsockets();
    this.setRoutes();
    this.catchErrors();
  }

  private setWebsockets() {

  }

  private setMiddlewares(): void {
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(helmet());
    this.express.use(cookieParser());
  }

  private setRoutes(): void {
    this.express.use('/api', apiV1);
  }

  private catchErrors(): void {
      this.express.use(errorHandler.notFound);
      this.express.use(errorHandler.internalServerError);
  }
}

export default new App().express;


