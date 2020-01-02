import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import {ApiHandleError} from "../helpers/apiWrapper";
import {AuthRequired} from "../helpers/withAuth";
import {AccessLevel, User} from "../entity/User";
import {AccessType, withOrganization, withUser} from "../helpers/withResources";
import {registerUser} from "./login";
import {LessThanOrEqual} from "typeorm";
import {Organization} from "../entity/Organization";

export class UserController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async create(req: Request, res: Response, next: NextFunction, session: Session) {
        const {username, name, accessLevel, organization, password, email, subscribed} = req.body;
        const thisUser = await session.user;
        if (accessLevel <= thisUser.accessLevel && thisUser.accessLevel !== AccessLevel.SUPERUSER) {
            res.status(401).send({
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

        const user = await registerUser(username, name, email, subscribed, password, accessLevel);
        user.organization = associate;
        await user.save();
        await associate.save()

        res.status(200).send({
            success: true,
            data: user,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withUser(req.params.id, res, session, AccessType.READ, async (user) => {
            console.log('find one user: ' + JSON.stringify(user));
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

            let newOrg: Organization | undefined = undefined;
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
}

const router = Router();
const controller = new UserController();

// Retrieve all Users
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.findOne.bind(controller));
router.get('/', controller.find.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export const usersRouter = router;
