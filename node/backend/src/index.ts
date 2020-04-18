
import app from "./App";
import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import CONFIG from "./config/config";
import { registerUser } from "./controllers/login";
import { AccessLevel, User } from "../../common/src/models/User";
import { Document } from "../../common/src/models/Document";
import pLimit from 'p-limit';
import { DocumentUpgrader, fixOperationIds } from "./services/DocumentUpgrader";

const limit = pLimit(4);

const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;

async function ensureInitialUser() {
    const repo = getRepository(User);
    const logins = await User.count();
    if (logins === 0) {

        const login = await registerUser("admin", "Root User", null, true, "pleasechange", AccessLevel.SUPERUSER);
    }

    // migrate old documents
    const docs = await Document.find();
}

createConnection().then(async (connection) => {
    await ensureInitialUser();
    DocumentUpgrader.initialize();
    // await fixOperationIds();

    app.enable("trust proxy");

    app.listen(Number(PORT), "0.0.0.0", (err) => {
        if (err) {
            return console.log(err);
        }

        console.log("AWS key: " + process.env.AWS_ACCESS_KEY);
        console.log("MQ url: " + process.env.MQ_URL);
        console.log("MQ username: " + process.env.MQ_USERNAME);

        console.log(`Server is listening on ${PORT}`);
    });
}).catch((error) => console.log(error));
