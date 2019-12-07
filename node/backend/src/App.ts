import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import expressWs from 'express-ws';

const expressApp = expressWs(express()).app;

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


