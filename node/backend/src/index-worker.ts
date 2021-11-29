import appWorker from "./AppWorker";
import "reflect-metadata";
import { createConnection } from "typeorm";
import CONFIG from "./config/config";

const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;

createConnection().then(async (connection) => {
    appWorker.enable("trust proxy");
    appWorker.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Worker Server is listening on ${PORT}`);
    });
}).catch((error) => console.log(error));
