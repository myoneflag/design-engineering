import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import routerWorker from "./router-worker";
import * as errorHandler from "./helpers/errorHandler";

class AppWorker {
    public express: express.Application;

    constructor() {
        console.log("Worker start");
        this.express = express();
        this.setMiddlewares();
        this.setRoutes();
        this.catchErrors();
    }

    private setMiddlewares(): void {
        this.express.use(cors());
        this.express.use(morgan("dev"));
        this.express.use(bodyParser.json({limit: '20mb'}));
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
