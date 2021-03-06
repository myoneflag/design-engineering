
import app from "./App";
import "reflect-metadata";
import { createConnection } from "typeorm";
import CONFIG from "./config/config";
import { registerUser } from "./controllers/login";
import { AccessLevel, User } from "../../common/src/models/User";
import { Document } from "../../common/src/models/Document";
import pLimit from 'p-limit';
import { Organization } from "../../common/src/models/Organization";

const limit = pLimit(4);

const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;

async function ensureInitialUser() {
    const logins = await User.count();
    const organizations = await Organization.count()
    if (logins === 0 && organizations === 0) {

        const org = Organization.create();
        org.id = "test";
        org.name = "test";
        await org.save();

        const login = await registerUser({
            username: "admin",
            firstname: "Root User",
            subscribed: true,
            password: "pleasechange",
            access:  AccessLevel.SUPERUSER,
            email: CONFIG.INIT_SUPERUSER_EMAIL,
            organization: org,
            verifyEmail: false
        });
    }

    // migrate old documents
    const docs = await Document.find();
}

createConnection().then(async (connection) => {
    await ensureInitialUser();

    app.enable("trust proxy");

    app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Server is listening on ${PORT}`);
    });
}).catch((error) => console.log(error));
