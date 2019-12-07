import app from './App';
import CONFIG from './config/config';
import "reflect-metadata";
import {createConnection} from "typeorm";
import {AccessLevel, User} from "./entity/User";
import {registerUser} from "./controllers/login";
import {Document} from './entity/Document';
import {Router} from "express";
import {withAuth} from "./helpers/withAuth";

const PORT = CONFIG.PORT;
Error.stackTraceLimit = Infinity;

async function initializeDatabase() {
    const logins = await User.count();
    if (logins === 0) {

        const login = await registerUser('admin', "Root User",'pleasechange', AccessLevel.SUPERUSER);
    }
}


createConnection().then(async connection => {
    await initializeDatabase();

    app.listen(PORT, err => {
        if (err) {
            return console.log(err);
        }

        initializeDatabase();

        console.log(`Server is listening on ${PORT}`);
    });
}).catch(error => console.log(error));
