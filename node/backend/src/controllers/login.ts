import * as bcrypt from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import uuid from "uuid";
import { AccessEvents, LoginEventType } from "../entity/AccessEvents";
import { Session } from "../entity/Session";
import { AccessLevel, User } from "../entity/User";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";

export async function registerUser(username: string, name: string, email: string, subscribed: boolean, password: string, access: AccessLevel): Promise<User> {
    const login = User.create();
    login.username = username;
    login.name = name;
    login.email = email;
    login.subscribed = subscribed;
    login.passwordHash = await bcrypt.hash(password, 10);
    login.accessLevel = access;
    return login.save();
}

export class LoginController {

    @ApiHandleError()
    public async login(req: Request, res: Response, next: NextFunction) {
        const [login] = await User.find({where: {username: req.body.username}, select: ['passwordHash', 'username']});

        const event = AccessEvents.create();
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = req.body.username || '';
        event.type = LoginEventType.LOGIN;
        event.url = req.originalUrl;

        if (!login) {
            res.status(404).send({
                success: false,
                message: "User not found",
            });
            event.success = false;
            await event.save();
            return;
        }

        const result = await bcrypt.compare(req.body.password, login.passwordHash);
        if (!result) {
            res.status(401).send({
                success: false,
                message: "Password Incorrect",
            });
            event.success = false;
            await event.save();
            return;
        }

        let existingSession = await Session
            .createQueryBuilder('session')
            .where('session.user = :user', {user : login.username})
            .getOne();


        if (!existingSession) {
            existingSession = Session.create();
            existingSession.id = uuid();
        }

        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        existingSession.expiresOn = dayAfter;
        existingSession.user = Promise.resolve(login);
        await existingSession.save();

        res.status(200).send({
            success: true,
            data: existingSession.id,
        });

        event.success = true;
        event.user = login;
        await event.save();
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async logout(req: Request, res: Response, next: NextFunction, session: Session) {
        await session.remove();
        res.status(200).send({
            success: true,
            data: {},
        });

        const event = AccessEvents.create();
        event.type = LoginEventType.LOGOUT;
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = (await session.user).username;
        event.user = (await session.user);
        event.success = true;
        event.url = req.originalUrl;
        await event.save();
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async session(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        await user.reload();

        res.status(200).send({
            success: true,
            data: user,
        });


        const event = AccessEvents.create();
        event.type = LoginEventType.SESSION_GET;
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = (await session.user).username;
        event.user = (await session.user);
        event.success = true;
        event.url = req.originalUrl;
        await event.save();
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async changePassword(req: Request, res: Response, next: NextFunction, session: Session) {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        const loginInternal = await session.user;
        const login = await User.findOne({where: {username: loginInternal.username}, select: ['passwordHash', 'username']});

        const result = await bcrypt.compare(currentPassword, login.passwordHash);

        const event = AccessEvents.create();
        event.type = LoginEventType.PASSWORD_CHANGE;
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = login.username;
        event.user = login;
        event.url = req.originalUrl;

        if (!result) {
            res.status(401).send({
                success: false,
                message: "Current password is incorrect",
            });
            event.success = false;
            await event.save();
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



        event.success = true;
        await event.save();

        return;
    }


    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async acceptEula(req: Request, res: Response, next: NextFunction, session: Session) {
        const myUser = await session.user;
        myUser.eulaAccepted = true;
        myUser.eulaAcceptedOn = new Date();
        await myUser.save();

        const event = AccessEvents.create();
        event.type = LoginEventType.ACCEPT_EULA;
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = myUser.username;
        event.user = myUser;
        event.url = req.originalUrl;
        event.success = true;
        await event.save();


        res.status(200).send({
            success: true,
            data: null,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async declineEula(req: Request, res: Response, next: NextFunction, session: Session) {
        const myUser = await session.user;
        myUser.eulaAccepted = false;
        myUser.eulaAcceptedOn = null;
        await myUser.save();

        const event = AccessEvents.create();
        event.type = LoginEventType.DECLINE_EULA;
        event.dateTime = new Date();
        event.ip = req.ip;
        event.userAgent = req.get('user-agent') || '';
        event.username = myUser.username;
        event.user = myUser;
        event.url = req.originalUrl;
        event.success = true;
        await event.save();

        res.status(200).send({
            success: true,
            data: null,
        });
    }
}
const router: Router = Router();

const controller = new LoginController();

// Retrieve all Users
router.post('/login', controller.login.bind(controller));
router.all('/logout', controller.logout.bind(controller));
router.all('/session', controller.session.bind(controller));
router.post('/login/password', controller.changePassword.bind(controller));
router.post('/acceptEula', controller.acceptEula.bind(controller));
router.post('/declineEula', controller.declineEula.bind(controller));

export const loginRouter = router;

