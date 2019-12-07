import {AuthRequired} from "../helpers/withAuth";
import {Catalog} from "../entity/Catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import * as initialCatalog from "../initial-catalog.json";
import {Document} from '../entity/Document';
import {AccessLevel, User} from "../entity/User";
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import {ApiHandleError} from "../helpers/apiWrapper";
import {log} from "util";

export async function registerUser(username: string, name: string, password: string, access: AccessLevel): Promise<User> {
    const login = User.create();
    login.username = username;
    login.name = name;
    login.passwordHash = await bcrypt.hash(password, 10);
    login.accessLevel = access;
    return await login.save();
}

export class LoginController {

    @ApiHandleError()
    public async login(req: Request, res: Response, next: NextFunction) {
        const [login] = await User.find({where: {username: req.body.username}, select: ['passwordHash', 'username']});
        if (!login) {
            res.status(404).send({
                success: false,
                message: "User not found",
            });
            return;
        }

        const result = await bcrypt.compare(req.body.password, login.passwordHash);
        if (!result) {
            res.status(401).send({
                success: false,
                message: "Password Incorrect",
            });
            return;
        }

        let existingSession = await Session
            .createQueryBuilder('session')
            .where('session.user = :user', {user : login.username})
            .getOne();

        if (!existingSession) {
            existingSession = Session.create();
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            existingSession.expiresOn = dayAfter;
            existingSession.user = Promise.resolve(login);
            existingSession.id = uuid();
            await existingSession.save();
        }
        const catalogs = await Catalog.find();
        res.status(200).send({
            success: true,
            data: existingSession.id,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async logout(req: Request, res: Response, next: NextFunction, session: Session) {
        await session.remove();
        res.status(200).send({
            success: true,
            data: {},
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async session(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        await user.reload();

        res.status(200).send({
            success: true,
            data: user,
        })
    }

    @ApiHandleError()
    @AuthRequired()
    public async changePassword(req: Request, res: Response, next: NextFunction, session: Session) {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        const _login = await session.user;
        const login = await User.findOne({where: {username: _login.username}, select: ['passwordHash', 'username']});

        const result = await bcrypt.compare(currentPassword, login.passwordHash);


        if (!result) {
            res.status(401).send({
                success: false,
                message: "Current password is incorrect",
            });
            return;
        }

        login.passwordHash = await bcrypt.hash(newPassword, 10);
        await login.save();

        await session.remove();
        const newSession = Session.create();
        newSession.id = uuid();
        newSession.user = Promise.resolve(login);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        newSession.expiresOn = dayAfter;

        await newSession.save();

        res.status(200).send({
            success: true,
            data: newSession.id,
        });

        return;
    }
}
const router: Router = Router();

const controller = new LoginController();

// Retrieve all Users
router.post('/login', controller.login.bind(controller));
router.all('/logout', controller.logout.bind(controller));
router.all('/session', controller.session.bind(controller));
router.post('/login/password', controller.changePassword.bind(controller));

export const loginRouter = router;

