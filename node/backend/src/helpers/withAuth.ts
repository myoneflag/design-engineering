
import { NextFunction, Request, Response } from "express";
import { AccessEvents, LoginEventType } from "../../../common/src/models/AccessEvents";
import { Session } from "../../../common/src/models/Session";
import { AccessLevel } from "../../../common/src/models/User";
import { errorResponse } from "./apiWrapper";

export function AuthRequired(minAccessLevel?: AccessLevel, eulaNeeded: boolean = true) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;
        descriptor.value = async (req: Request, res: Response, next: NextFunction) => {
            return withAuth(
                req,
                (session) => {
                    return original(req, res, next, session);
                },
                (message) => {
                    errorResponse(res, message, 401);
                },
                minAccessLevel,
                eulaNeeded,
            );
        }
    };
}

export async function withAuth<T>(
    req: Request,
    fn: (session: Session) => Promise<T>,
    onFail: (msg: string) => any,
    minAccessLevel?: AccessLevel,
    eulaNeeded: boolean = true,
    ): Promise<T> {
    if (!req.cookies) {
        onFail("Authorization required, but session-id cookie is missing");
        return;
    }
    
    const event = AccessEvents.create();
    event.dateTime = new Date();
    event.ip = req.ip;
    event.userAgent = req.get('user-agent') || '';
    event.success = true;
    event.url = req.originalUrl;
    
    const sessionId = req.cookies['session-id'];
    const s =  await Session.findOne({id: sessionId});

    if (s) {
        await s.reload();
        event.username = (await s.user).username;
        event.user = (await s.user);

        if (s.expiresOn < new Date()) {
            onFail("Session Expired");
            event.type = LoginEventType.SESSION_EXPIRED;
            await event.save();
            return;
        }

        if (minAccessLevel !== undefined) {
            const thisLogin = await s.user;
            if (thisLogin.accessLevel > minAccessLevel) {
                onFail('Unauthorized Access');
                event.type = LoginEventType.UNAUTHORISED_ACCESS;
                await event.save();
                return;
            }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (s.expiresOn < tomorrow) {
            s.expiresOn = tomorrow;
            await s.save();

            event.type = LoginEventType.SESSION_REFRESH;
            await event.save();
        }

        event.type = LoginEventType.AUTHORISED_ACCESS;
        await event.save();

        if (eulaNeeded && !(await s.user).eulaAccepted ) {
            onFail("EULA not yet accepted");
        }

        return fn(s);
    } else {

        event.type = LoginEventType.UNAUTHORISED_ACCESS;
        await event.save();

        return onFail("Unauthorized Access");
    }
}
