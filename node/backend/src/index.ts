import app from "./App";
import CONFIG from "./config/config";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { AccessLevel, User } from "./entity/User";
import { registerUser } from "./controllers/login";
import AWS, { Credentials } from "aws-sdk";
import * as https from "https";
import ProxyAgent from 'https-proxy-agent';


const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;

async function initializeDatabase() {
    const logins = await User.count();
    if (logins === 0) {

        const login = await registerUser("admin", "Root User", undefined, true, "pleasechange", AccessLevel.SUPERUSER);
    }
}

createConnection().then(async connection => {
    await initializeDatabase();


    app.enable("trust proxy");

    app.listen(Number(PORT), "0.0.0.0", err => {
        if (err) {
            return console.log(err);
        }

        initializeDatabase();

        console.log(`Server is listening on ${PORT}`);
    });
}).catch(error => console.log(error));
