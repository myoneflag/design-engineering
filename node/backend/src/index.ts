
import app from "./App";
import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import CONFIG from "./config/config";
import { registerUser } from "./controllers/login";
import { AccessLevel, User } from "../../common/src/models/User";
import { Document } from "../../common/src/models/Document";
import { upgradeDocument } from "./upgrade-drawing";

const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;



async function initializeDatabase() {
    const logins = await User.count();
    if (logins === 0) {

        const login = await registerUser("admin", "Root User", null, true, "pleasechange", AccessLevel.SUPERUSER);
    }

    // migrate old documents
    const docs = await Document.find();
    await Promise.all(docs.map((doc) => {
        return upgradeDocument(doc);
    }));
}

createConnection().then(async (connection) => {
    await connection.runMigrations({
        transaction: "each",
    });
    await initializeDatabase();

    app.enable("trust proxy");

    app.listen(Number(PORT), "0.0.0.0", (err) => {
        if (err) {
            return console.log(err);
        }

        console.log("AWS key: " + process.env.AWS_KEY);
        initializeDatabase();

        console.log(`Server is listening on ${PORT}`);
    });
}).catch((error) => console.log(error));
