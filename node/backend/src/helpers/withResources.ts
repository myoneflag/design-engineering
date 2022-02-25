import { Organization } from "../../../common/src/models/Organization";
import { Response } from "express";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Session } from "../../../common/src/models/Session";
import { errorResponse } from "./apiWrapper";

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
        errorResponse(res, "Don't use withResources to create");
        return;
    }

    if (access === AccessType.DELETE) {
        if (user.accessLevel > AccessLevel.SUPERUSER) {
            errorResponse(res, "You need to be a founder to do this.", 401);
            return;
        }
    }

    const org = await Organization.findOne({ id });

    if (!org) {
        errorResponse(res, "Organization with id " + id + " cannot be found", 404);
        return;
    }

    if (access === AccessType.READ) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const memberOf = await user.organization;

            if (memberOf == null || memberOf.id !== org.id) {
                errorResponse(res, "You need to be an admin to view other organizations.", 401);
                return;
            }
        }
    }

    if (access === AccessType.UPDATE) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const memberOf = await user.organization;
            if (memberOf == null || memberOf.id !== org.id) {
                errorResponse(res, "You need to be an admin to edit other organizations.", 401);
                return;
            }
        }
        if (user.accessLevel > AccessLevel.MANAGER) {
            errorResponse(res, "You need to be a manager to edit your organization.", 401);
            return;
        }
    }

    return await fn(org)
        .catch((err) => {
            errorResponse(res, err);
            return undefined;
        });

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

    let doc = await Document.findOne({ id });

    if (!doc) {
        errorResponse(res, "Document cannot be found", 404);
        return;
    }

    if (doc.state !== DocumentStatus.ACTIVE) {
        if (user.accessLevel > AccessLevel.MANAGER) {
            errorResponse(res, "Document cannot be found", 404);
        }
    }

    if (access === AccessType.DELETE) {
        if (user.accessLevel > AccessLevel.MANAGER) {
            const creator = doc.createdBy;
            if (creator.username !== user.username) {
                errorResponse(res, "You need to be a manager to delete other people's documents", 401);
                return;
            }
        }

        if (user.accessLevel > AccessLevel.ADMIN) {
            const owner = await doc.organization;
            const belong = await user.organization;
            if (belong == null || belong.id !== owner.id) {
                errorResponse(res, "You need to be an admin to delete other organization's documents", 401);
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
            if (!(user.temporaryUser &&
                doc.createdBy.username === user.username) && (memberOf == null || owner.id !== memberOf.id)) {
                errorResponse(res, "You need to be an admin to view other organizations's docs", 401);
                return;
            }
        }
    }

    if (access === AccessType.UPDATE) {
        if (user.accessLevel > AccessLevel.ADMIN) {
            const owner = await doc.organization;
            const memberOf = await user.organization;
            if (!(user.temporaryUser && doc.createdBy.username === user.username) &&
                (memberOf == null || owner.id !== memberOf.id)) {
                errorResponse(res, "You need to be an admin to edit other organizations's docs.", 401);
                return;
            }
        }
    }
    if (access === AccessType.CREATE) {
        errorResponse(res, "Don't use withResources to create");
        return;
    }

    if (!doc) {
        errorResponse(res, "Document with id " + id + " cannot be found", 404);
        return;
    }

    return await fn(doc)
        .catch((err) => {
            errorResponse(res, err);
            return undefined;
        });
}

export async function withUser<T>(
    username: string,
    res: Response,
    session: Session,
    access: AccessType,
    fn: (user: User) => Promise<T>,
): Promise<T | undefined> {

    if (access === AccessType.CREATE) {

        errorResponse(res, "Don't use withResources to create");
        return;
    }
    const currUser = await session.user;
    await currUser.reload();

    if (access === AccessType.DELETE) {
        if (currUser.accessLevel > AccessLevel.ADMIN) {
            errorResponse(res, "You need to be an admin to create or remove users", 401);
            return;
        }
    }

    const myOrg = currUser.organization;

    const user = await User.findOne({ username }, { relations: ['organization'] });
    if (!user) {
        errorResponse(res, "User with username " + username + " cannot be found", 404);
        return;
    }

    if (access === AccessType.UPDATE) {
        const targetAccess = user.accessLevel;
        if (currUser.accessLevel >= targetAccess &&
            currUser.username !== user.username && currUser.accessLevel !== AccessLevel.SUPERUSER) {
            errorResponse(res, "You can only edit subordinates or yourself", 401);
            return;
        }

        const targetOrg = user.organization;

        if (currUser.accessLevel === AccessLevel.MANAGER) {
            if (targetOrg == null || myOrg == null || targetOrg.id !== myOrg.id) {
                errorResponse(res, "You can only edit subordinates in your own organization", 401);
                return;
            }
        }
    }

    if (access === AccessType.READ) {
        if (currUser.accessLevel >= AccessLevel.MANAGER) {
            const targetOrg = user.organization;
            const targetAccess = user.accessLevel;
            if (targetAccess >= AccessLevel.MANAGER) {
                console.log((user.temporaryUser && currUser.username === user.username));
                console.log(user);
                console.log(currUser);
                if (!(user.temporaryUser && currUser.username === user.username) &&
                    (targetOrg == null || myOrg == null || targetOrg.id !== myOrg.id)) {
                    errorResponse(res, "You can only see managers and users in your own organization", 401);
                    return;
                }
            }
        }
    }

    return await fn(user)
        .catch((err) => {
            errorResponse(res, err);
            return undefined;
        });

}
