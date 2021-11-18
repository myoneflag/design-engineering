import * as bcrypt from "bcrypt";
import { getRepository } from "typeorm";
import { NodeMailerTransporter } from './../nodemailer';
import { NextFunction, Request, Response, Router } from "express";
import { Session } from "../../../common/src/models/Session";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import { AccessLevel, User, Create } from "../../../common/src/models/User";
import { AccessEvents } from '../../../common/src/models/AccessEvents';
import { AccessType, withOrganization, withUser } from "../helpers/withResources";
import { registerUser } from "./login";
import { Organization } from "../../../common/src/models/Organization";
import VerifyEmail from '../email/VerifyEmail';
import { PasswordResetEmailType, ForgotPasswordEmail, SetNewPasswordEmail } from '../email/ForgotPassword';
import H2xNewMemberEmail from '../email/H2xNewMemberEmail';
import random from '../helpers/random';
import Zapier from "../services/Zapier";
import uuid from "uuid";
const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/;

export class UserController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async create(req: Request, res: Response, next: NextFunction, session: Session) {
        const {username, firstname, lastname, accessLevel, organization, password, email, subscribed} = req.body;

        if (!firstname || !lastname || !username || !email ) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
            });
        } else if (await User.findOne({username})) {
            return res.status(400).send({
                success: false,
                message: "User with that ID already exists",
            });
        } else if (!(EMAIL_REGEX.test(email))) {
            return res.status(400).send({
                success: false,
                message: "Invalid email address",
            });
        }

        let newPassword = password;
        let sendPasswordEmail = false;
        if (!newPassword) {
            newPassword = uuid.v4().toString();
            sendPasswordEmail = true;
        }        

        const thisUser = await session.user;
        if (accessLevel <= thisUser.accessLevel && thisUser.accessLevel !== AccessLevel.SUPERUSER) {
            res.status(400).send({
                success: false,
                message: "You can only create users less powerful than you.",
            });
            return;
        }

        let associate: Organization;
        if (organization) {
            let success = false;
            await withOrganization(organization, res, session, AccessType.UPDATE, async (org) => {
                success = true;
                associate = org;
                await associate.save();
            });
            if (!success) {
                return;
            }
        }

        if (await User.findOne({username})) {
            res.status(400).send({
                success: false,
                message: "User with that ID already exists",
            });
            return;
        }

        const user: User = await registerUser({
            username,
            firstname,
            lastname,
            email,
            subscribed,
            password: newPassword,
            access: accessLevel,
            temporaryUser: false,
            organization: associate,
            verifyEmail: !sendPasswordEmail
        });

        await Zapier.callCreateHubSpotContact({ firstName: user.name, lastName: user.lastname, email: user.email})

        if (sendPasswordEmail) {
            await resetUserPassword(user, req, SetNewPasswordEmail);
        }

        res.status(200).send({
            success: true,
            data: user,
        });
    }

    @ApiHandleError()
    public async signUp(req: Request, res: Response) {
        const {firstname, lastname, username, password, confirmPassword, email}: Create = req.body;
        
        if (!firstname || !lastname || !username || !email || !password ) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
            });
        } else if (await User.findOne({username})) {
            return res.status(400).send({
                success: false,
                message: "User with that ID already exists",
            });
        } else if (confirmPassword !== password) {
            return res.status(400).send({
                success: false,
                message: "Password and Confirm Password does not match",
            });
        } else if (!(EMAIL_REGEX.test(email))) {
            return res.status(400).send({
                success: false,
                message: "Invalid email address",
            });
        }

        const allOrganization = await Organization.find({ select: ["id"] });
        
        let orgId: string = '';
        while (allOrganization.map(obj => obj.id).includes(orgId = random(20, true)));

        const org: Organization = Organization.create();
        org.id = orgId;
        org.name = 'Free Account';
        await org.save();

        const user: User = await registerUser({
            email,
            username,
            firstname,
            lastname,
            subscribed: false,
            password,
            access: AccessLevel.USER,
            organization: org,
            verifyEmail: true
        });
        
        const url = getHostname(req) + '/confirm-email?email=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(user.email_verification_token);
        await NodeMailerTransporter.sendMail(VerifyEmail({name: user.name, to: user.email, url}));

        await NodeMailerTransporter.sendMail(H2xNewMemberEmail({
            firstname: user.name,
            lastname: user.lastname,
            username: user.username,
            email: user.email,
        }));

        await Zapier.callCreateHubSpotContact({ firstName: user.name, lastName: user.lastname, email: user.email})
        
        return res.status(200).send({
            success: true,
            data: user,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withUser(req.params.id, res, session, AccessType.READ, async (user) => {
            res.status(200).send({
                success: true,
                data: user,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        const thisUser = await session.user;
        await thisUser.reload();
        let result: User[] = [];
        if (thisUser.accessLevel >= AccessLevel.MANAGER) {
            const myOrg = await thisUser.organization;
            if (myOrg) {
                // only this org.
                result = await User
                    .createQueryBuilder('user')
                    .where('user.organization = :organization', {organization: myOrg.id})
                    .getMany();

                const seenUsernames = new Set<string>();
                await Promise.all(result.map((u) => {
                    seenUsernames.add(u.username);
                    return u.reload();
                }));
            }
        } else {
            result = await User.find({relations: ['organization']});
        }

        res.status(200).send({
            success: true,
            data: result,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        await withUser(req.params.id, res, session, AccessType.UPDATE, async (user) => {
            const {name, accessLevel, organization, email, subscribed} = req.body;
            const me = await session.user;
            user.name = name;
            if (accessLevel < me.accessLevel || (accessLevel === me.accessLevel && me.accessLevel !== AccessLevel.SUPERUSER && me.username !== user.username) ) {
                res.status(401).send({
                    success: false,
                    message: "You can't make someone more powerful than you.",
                });
                return;
            }

            if (accessLevel !== me.accessLevel && user.username === me.username) {
                res.status(401).send({
                    success: false,
                    message: "You can't change your own access level.",
                });
                return;
            }

            let newOrg: Organization | undefined;
            if (organization) {
                let success = false;
                let accessType = AccessType.UPDATE;
                if (user.organization && user.organization.id === organization) {
                    accessType = AccessType.READ;
                }
                await withOrganization(organization, res, session, accessType, async (orgTo) => {
                    newOrg = orgTo;
                    success = true;
                });
                if (!success) {
                    return;
                }
            }

            user.organization = newOrg;
            user.name = name;
            user.email = email;
            user.subscribed = subscribed;
            user.accessLevel = accessLevel;

            await user.save();
            res.status(200).send({
                success: true,
                data: user,
            });
            return;
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async delete(req: Request, res: Response, next: NextFunction, session: Session) {
        await withUser(req.params.id, res, session, AccessType.DELETE, async (del) => {
            await del.remove();
            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async sendEmailVerification(req: Request, res: Response) {
        const data: {email: string, username: string} = req.body;
        const user: User = await User.findOne({ where: {
            username: data.username,
            email: data.email,
        }});

        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found!',
            });
        }

        user.email_verification_dt = new Date();
        user.email_verification_token = await bcrypt.hash(data.email, 10);
        await user.save();

        const url = getHostname(req) + '/confirm-email?email=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(user.email_verification_token);
        await NodeMailerTransporter.sendMail(VerifyEmail({name: user.name, to: user.email, url}));

        return res.send({
            success: true,
            message: "Please check your email.",
        });
    }

    @ApiHandleError()
    public async forgotPassword(req: Request, res: Response) {
        const data: {email: string, username: string} = req.body;
        const user: User = await User.findOne({ 
            where: {
                username: data.username,
                email: data.email,
            }
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found!",
            });
        }

        await resetUserPassword(user, req, ForgotPasswordEmail);

        return res.send({
            success: true,
            message: "We have sent a password reset link in your email.",
        });
    }

    @ApiHandleError()
    public async passwordReset(req: Request, res: Response) {
        const data: {
            password: string
            confirmPassword: string
            email: string
            token: string
        } = req.body;

        if (data.confirmPassword !== data.password) {
            return res.send({
                success: false,
                message: "New Password and Retype New Password does not match.",
            });
        }

        const user: User = await getRepository(User)
            .createQueryBuilder("user")
            .where("user.password_reset_token IS NOT NULL")
            .andWhere("user.password_reset_token = :password_reset_token ", { password_reset_token: data.token })
            .andWhere("user.email = :email", { email: data.email })
            .getOne();

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "Email doesn't exist or invalid token!",
            });
        }

        let now = +new Date();

        const twoweeks = 2 * 7 * 60 * 60 * 24 * 1000;
        if ((now - +new Date(user.password_reset_dt)) > twoweeks) {
            return res.send({
                success: false,
                message: "Password reset link has expired.",
                redirect: true,
            });
        }

        user.passwordHash = await bcrypt.hash(data.password, 10);
        user.password_reset_token = null;
        await user.save();

        return res.send({
            success: true,
            message: "Your password has been changed successfully!",
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async confirmEmail(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        
        user.email = req.body.email;
        
        await user.save();

        return res.send({
            success: true,
            data: user,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.SUPERUSER)
    public async activeUsers(req: Request, res: Response) {
        const activeFrom = req.query.activeFrom + " 00:00:00";
        const activeTo = req.query.activeTo + " 23:59:59";
        const timezone = req.query.timezone;

        const data = await getRepository(AccessEvents)
            .createQueryBuilder("access_events")
            .select(`TO_CHAR(access_events."dateTime" at time zone 'utc' at time zone '${timezone}', 'mm/dd/yyyy') AS date`)
            .addSelect("COUNT(DISTINCT access_events.username) as total_active")
            .leftJoin("access_events.user", "user")
            .where("(access_events.username <> '') IS TRUE")
            .andWhere("user.accessLevel NOT IN (:...role)", { role: [AccessLevel.SUPERUSER, AccessLevel.ADMIN] })
            .andWhere(req.query.activeFrom ? `access_events."dateTime" at time zone 'utc' at time zone '${timezone}' >= :activeFrom` : '1=1', { activeFrom: activeFrom })
            .andWhere(req.query.activeTo ? `access_events."dateTime" at time zone 'utc' at time zone '${timezone}' <= :activeTo` : '1=1', { activeTo: activeTo })
            .groupBy(`TO_CHAR(access_events."dateTime" at time zone 'utc' at time zone '${timezone}', 'mm/dd/yyyy')`)
            .orderBy(`TO_CHAR(access_events."dateTime" at time zone 'utc' at time zone '${timezone}', 'mm/dd/yyyy')`, "ASC")
            .getRawMany();

        return res.send({
            success: true, 
            data
        });
    }
}

async function resetUserPassword(user: User, req, email: PasswordResetEmailType) {
    user.password_reset_dt = new Date();
    user.password_reset_token = await bcrypt.hash(user.email, 10);
    await user.save();

    const url = getHostname(req) + '/password-reset?email=' + encodeURIComponent(user.email) + '&token=' + encodeURIComponent(user.password_reset_token);
    await NodeMailerTransporter.sendMail(email({ name: user.name, to: user.email, url, username: user.username }));
}

function getHostname(req: Request) {
    let hostname = req.get('host')
    // local development non-https hostnames on non-standard ports, that are not included in the hostname header should be considered
    if (req.protocol != 'https' && req.socket.localPort && !hostname.endsWith(':' + req.socket.localPort) && ![80,443].includes(req.socket.localPort)) {
        hostname = hostname + ':' + req.socket.localPort
    }
    return req.protocol + '://' + hostname;
}


const router = Router();
const controller = new UserController();

router.post('/', controller.create.bind(controller));
router.post('/signUp', controller.signUp.bind(controller));
router.get('/active-users', controller.activeUsers.bind(controller));
router.get('/:id', controller.findOne.bind(controller));
router.get('/', controller.find.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.post('/send-email-verification', controller.sendEmailVerification.bind(controller));
router.post('/forgot-password', controller.forgotPassword.bind(controller));
router.post('/password-reset', controller.passwordReset.bind(controller));
router.post('/confirm-email', controller.confirmEmail.bind(controller));

export const usersRouter = router;

