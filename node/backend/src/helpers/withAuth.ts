import {Session} from "../entity/Session";
import {NextFunction, Request, Response} from "express";
import {AccessLevel} from "../entity/User";

export function AuthRequired(minAccessLevel?: AccessLevel) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let original = descriptor.value;
        descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
            return await withAuth(
                req,
                (session) => {
                    return original(req, res, next, session);
                },
                (message) => {
                    res.status(401).send({
                        success: false,
                        message,
                    })
                },
                minAccessLevel,
            );
        }
    };
}

export async function withAuth<T>(
    req: Request,
    fn: (session: Session) => Promise<T>,
    onFail: (msg: string) => any,
    minAccessLevel?: AccessLevel,
    ): Promise<T> {
    if (!req.cookies) {
        onFail("Authorization required, but session-id cookie is missing");
        return;
    }
    const sessionId = req.cookies['session-id'];
    const s =  await Session.findOne({id: sessionId});
    if (s) {
        if (s.expiresOn < new Date()) {
            onFail("Session Expired");
            return;
        }

        if (minAccessLevel !== undefined) {
            const thisLogin = await s.user;
            if (thisLogin.accessLevel > minAccessLevel) {
                onFail('Unauthorized Access');
                return;
            }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (s.expiresOn < tomorrow) {
            s.expiresOn = tomorrow;
            await s.save();
        }
        return await fn(s);
    } else {
        return onFail("Unauthorized Access");
    }
}
