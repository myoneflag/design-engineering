
import * as bcrypt from "bcrypt";
import uuid from "uuid";
import { getRepository } from 'typeorm';
import { NextFunction, Request, Response, Router } from "express";
import { AccessEvents, LoginEventType } from "../../../common/src/models/AccessEvents";
import { Session } from "../../../common/src/models/Session";
import { AccessLevel, User } from "../../../common/src/models/User";
import { VideoView } from "../../../common/src/models/VideoView";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";
import { Organization } from './../../../common/src/models/Organization';
import { Onboarding } from '../../../common/src/models/Onboarding';
import { ShareDocument } from '../../../common/src/models/ShareDocument';
import { Operation } from '../../../common/src/models/Operation';
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import random from '../helpers/random';
import { cloneSimple } from '../../../common/src/lib/utils';
import {DrawingState, initialDrawing} from '../../../common/src/api/document/drawing';
import { CURRENT_VERSION } from '../../../common/src/api/config';
import { OPERATION_NAMES } from '../../../common/src/api/document/operation-transforms';
import {EXAMPLE_DRAWING, EXAMPLE_DRAWING_VERSION} from "../../../common/src/api/constants/example-drawing";
import {DocumentUpgrader} from "../services/DocumentUpgrader";
import {diffState} from "../../../common/src/api/document/state-differ";

export async function registerUser(data: {
    username: string
    firstname: string
    lastname?: string
    email?: string
    subscribed: boolean 
    password: string
    access: AccessLevel
    temporaryUser?: boolean
    organization?: Organization, 
    verifyEmail: boolean
}): Promise<User> {
    const onboarding: Onboarding = Onboarding.create();
    const login: User = User.create();
    login.username = data.username;
    login.name = data.firstname;
    login.lastname = data.lastname;
    login.email = data.email;
    if (data.verifyEmail) {
        login.email_verification_token = await bcrypt.hash(data.email, 10);
        login.email_verification_dt = new Date();    
    } else {
        login.email_verification_token = null;
        login.email_verification_dt = null;
    }
    login.subscribed = data.subscribed;
    login.passwordHash = await bcrypt.hash(data.password, 10);
    login.accessLevel = data.access;
    login.lastNoticeSeenOn = new Date();
    login.temporaryUser = data.temporaryUser;
    login.organization = data.organization;
    login.onboarding = await onboarding.save();
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
        existingSession.user = login;
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

        if (!login) {
            throw new Error('user not found');
        }

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
        newSession.user = login;
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

        // Create example document for new user
        const sd = ShareDocument.create();
        sd.token =  random(10);
        await sd.save();

        const doc = Document.create();
        doc.organization = myUser.organization;
        doc.createdBy = myUser;
        doc.createdOn = new Date();
        doc.metadata = {
            "title": "Example Project",
            "projectNumber": "0001",
            "projectStage": "Design",
            "designer": "H2X",
            "reviewed": "JM",
            "approved": "AH",
            "revision": 1,
            "client": "King Development",
            "description": "This is an example project to showcase the benefits of H2X."
        };
        doc.version = EXAMPLE_DRAWING_VERSION;
        doc.state = DocumentStatus.ACTIVE;
        doc.shareDocument = sd;
        await doc.save();

        const now = new Date();
        const op1 = Operation.create();
        op1.document = Promise.resolve(doc);
        op1.dateTime = now;
        op1.blame = null;
        op1.operation = diffState(initialDrawing(doc.locale), EXAMPLE_DRAWING, undefined)[0];
        op1.orderIndex = 0;
        await op1.save();
        const op2 = Operation.create();
        op2.document = Promise.resolve(doc);
        op2.dateTime = now;
        op2.blame = null;
        op2.operation = {"type": OPERATION_NAMES.COMMITTED_OPERATION, "id": 1};
        op2.orderIndex = 0;
        await op2.save();

        // In case the document is upgraded in development without updating the example document,
        // the example document needs to be upgraded.
        await DocumentUpgrader.onDocumentUpgradeRequest(doc.id);

        res.status(200).send({
            success: true,
            data: doc,
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

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER, false)
    public async onBoardingStats(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = session.user;
        const numDrawingsCreated = await Document.count({createdBy: user});
        const numFeedbackSubmitted = await FeedbackMessage.count({submittedBy: user});
        const views = await VideoView.createQueryBuilder('videoView')
            .where('videoView.user = :user', { user: session.user.username })
            .getMany();
        const viewedVideoIds = views.map((uv) => uv.videoId);

        return res.status(200).send({
            success: true,
            data: {
                numDrawingsCreated,
                numFeedbackSubmitted,
                viewedVideoIds,
            },
        });
    }

    @ApiHandleError()
    public async confirmEmail(req: Request, res: Response, next: NextFunction) {
        const params: {email: string, token: string} = req.body;

        const user = await getRepository(User)
            .createQueryBuilder("user")
            .where("user.email_verification_token IS NOT NULL")
            .andWhere("user.email_verification_token = :email_verification_token ", { email_verification_token: params.token })
            .andWhere("user.email = :email", { email: params.email })
            .getOne();

        if (!!user) {
            let now = +new Date();

            const oneday = 60 * 60 * 24 * 1000;
            if ((now - +new Date(user.email_verification_dt)) > oneday) {
                return res.send({
                    success: false,
                    message: "Email verification link has expired. Please enter your email address and we'll send another verification link.",
                });
            }

            user.email_verified_at = new Date();
            user.email_verification_token = null;
            await user.save();

            // Login automatically
            const event = AccessEvents.create();
            event.dateTime = new Date();
            event.ip = req.ip;
            event.userAgent = req.get('user-agent') || '';
            event.username = req.body.username || '';
            event.type = LoginEventType.LOGIN;
            event.url = req.originalUrl;

            let existingSession = await Session
                .createQueryBuilder('session')
                .where('session.user = :user', {user : user.username})
                .getOne();

            if (!existingSession) {
                existingSession = Session.create();
                existingSession.id = uuid();
            }

            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            existingSession.expiresOn = dayAfter;
            existingSession.user = user;
            await existingSession.save();

            event.success = true;
            event.user = user;
            await event.save();

            return res.send({
                success: true,
                data: existingSession.id,
            });
        } else {
            return res.send({
                success: false,
                redirect: true,
            });
        }
    }
}
const router: Router = Router();

const controller = new LoginController();

router.post('/login', controller.login.bind(controller));
router.all('/logout', controller.logout.bind(controller));
router.all('/session', controller.session.bind(controller));
router.post('/login/password', controller.changePassword.bind(controller));
router.post('/acceptEula', controller.acceptEula.bind(controller));
router.post('/declineEula', controller.declineEula.bind(controller));
router.get('/onBoardingStats', controller.onBoardingStats.bind(controller));
router.post('/confirm-email', controller.confirmEmail.bind(controller));

export const loginRouter = router;
