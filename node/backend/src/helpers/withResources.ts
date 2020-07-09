import { Organization } from "../../../common/src/models/Organization";
import { Response } from "express";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Session } from "../../../common/src/models/Session";

// Helper functions for resource gathering + permission checking.

export enum AccessType {
    CREATE,
    READ,
    UPDATE,
    DELETE,
    RESTORE,
}

export async function withOrganization<T>(
    id: string,
    res: Response,
    session: Session,
    access: AccessType,
    fn: (org: Organization) => Promise<T>,
): Promise<T | undefined> {
    const user = await session.user;
    await user.reload();

    if (access === AccessType.CREATE) {

        res.status(500).send({
            success: false,
            message: "Don't use withResources to create",
        });
        return;
    }
    /*
    if (access === AccessType.CREATE) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            res.status(401).send({
                success: false,
                message: "You need to be an admin to do this.",
            });
            return;
        }
    }*/

    if (access === AccessType.DELETE) {
        if (user.accessLevel > AccessLevel.SUPERUSER) {
            res.status(401).send({
                success: false,
                message: "You need to be a founder to do this.",
            });
            return;
        }
    }

    const org = await Organization.findOne({id});

    if (!org) {
        res.status(404).send({
            success: false,
            message: "Organization with id " + id + " cannot be found",
        });
        return;
    }

    if (access === AccessType.READ) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const memberOf = await user.organization;

            if (memberOf == null || memberOf.id !== org.id) {
                res.status(401).send({
                    success: false,
                    message: "You need to be an admin to view other organizations.",
                });
                return;
            }
        }
    }

    if (access === AccessType.UPDATE) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const memberOf = await user.organization;
            if (memberOf == null || memberOf.id !== org.id) {
                res.status(401).send({
                    success: false,
                    message: "You need to be an admin to edit other organizations.",
                });
                return;
            }
        }
        if (user.accessLevel > AccessLevel.MANAGER) {
            res.status(401).send({
                success: false,
                message: "You need to be a manager to edit your organization.",
            });
            return;
        }
    }


    return await fn(org);
}

export async function withDocument<T>(
    id: number,
    res: Response | undefined,
    session: Session,
    access: AccessType,
    fn: (doc: Document) => Promise<T>,
): Promise<T | undefined> {
    const user = await session.user;
    await user.reload();

    const doc = await Document.findOne({id});

    if (!doc) {
        if (res) {
            res.status(404).send({
                success: false,
                message: "Document cannot be found",
            });
        }
        return;
    }

    if (doc.state !== DocumentStatus.ACTIVE) {
        if (user.accessLevel > AccessLevel.MANAGER) {
            res.status(404).send({
                success: false,
                message: "Document cannot be found",
            });
        }
    }

    if (access === AccessType.DELETE) {
        if (user.accessLevel > AccessLevel.MANAGER) {
            const creator = doc.createdBy;
            if (creator.username !== user.username) {
                if (res) {
                    res.status(401).send({
                        success: false,
                        message: "You need to be a manager to delete other people's documents",
                    });
                }
                return;
            }
        }

        if (user.accessLevel > AccessLevel.ADMIN) {
            const owner = await doc.organization;
            const belong = await user.organization;
            if (belong == null || belong.id !== owner.id) {
                if (res) {
                    res.status(401).send({
                        success: false,
                        message: "You need to be an admin to delete other organization's documents",
                    });
                }
                return;
            }
        }
    }

    if (access === AccessType.READ) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const memberOf = await user.organization;
            const owner = await doc.organization;
            console.log('access type read')
            console.log(user)
            console.log(doc.createdBy)
            if (!(user.temporaryUser && doc.createdBy.username === user.username) && (memberOf == null || owner.id !== memberOf.id)) {
                if (res) {
                    res.status(401).send({
                        success: false,
                        message: "You need to be an admin to view other organizations's docs",
                    });
                }
                return;
            }
        }
    }

    if (access === AccessType.UPDATE) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const owner = await doc.organization;
            const memberOf = await user.organization;
            if (!(user.temporaryUser && doc.createdBy.username === user.username) && (memberOf == null || owner.id !== memberOf.id)) {
                if (res) {
                    res.status(401).send({
                        success: false,
                        message: "You need to be an admin to edit other organizations's docs.",
                    });
                }
                return;
            }
        }
    }



    if (access === AccessType.CREATE) {
        if (res) {
            res.status(500).send({
                success: false,
                message: "Don't use withResources to create",
            });
        }
        return;
    }

    if (!doc) {
        if (res) {
            res.status(404).send({
                success: false,
                message: "Document with id " + id + " cannot be found",
            });
        }
        return;
    }

    return await fn(doc);
}

export async function withUser<T>(
    username: string,
    res: Response,
    session: Session,
    access: AccessType,
    fn: (user: User) => Promise<T>,
): Promise<T | undefined> {


    if (access === AccessType.CREATE) {

        res.status(500).send({
            success: false,
            message: "Don't use withResources to create",
        });
        return;
    }
    const currUser = await session.user;
    await currUser.reload();

    if (access === AccessType.DELETE) {
        if (currUser.accessLevel > AccessLevel.ADMIN) {
            res.status(401).send({
                success: false,
                message: "You need to be an admin to create or remove users",
            });
            return;
        }
    }


    const myOrg = currUser.organization;

    const user = await User.findOne({username}, {relations: ['organization']});
    if (!user) {
        res.status(404).send({
            success: false,
            message: "User with username " + username + " cannot be found",
        });
        return;
    }

    if (access === AccessType.UPDATE) {
        const targetAccess = user.accessLevel;
        if (currUser.accessLevel >= targetAccess && currUser.username !== user.username && currUser.accessLevel !== AccessLevel.SUPERUSER) {
            res.status(401).send({
                success: false,
                message: "You can only edit subordinates or yourself",
            });
            return;
        }


        const targetOrg = user.organization;

        if (currUser.accessLevel === AccessLevel.MANAGER) {
            if (targetOrg == null || myOrg == null || targetOrg.id !== myOrg.id) {
                res.status(401).send({
                    success: false,
                    message: "You can only edit subordinates in your own organization",
                });
                return;
            }
        }
    }

    if (access === AccessType.READ) {
        if (currUser.accessLevel >= AccessLevel.MANAGER) {
            const targetOrg = user.organization;
            const targetAccess = user.accessLevel;
            console.log('am i here?')
            if (targetAccess >= AccessLevel.MANAGER) {
                console.log('checking condition')
                console.log((user.temporaryUser && currUser.username === user.username));
                console.log(user);
                console.log(currUser);
                if (!(user.temporaryUser && currUser.username === user.username) && (targetOrg == null || myOrg == null || targetOrg.id !== myOrg.id)) {
                    console.log('rejecting because of here?')
                    res.status(401).send({
                        success: false,
                        message: "You can only see managers and users in your own organization",
                    });
                    return;
                }
            }
        }
    }



    return await fn(user);
}
