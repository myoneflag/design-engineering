import {NextFunction, Request, Response} from "express";
import {Session} from "../entity/Session";

export function ApiHandleError() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let original = descriptor.value;
        descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
            try {
                return await original(req, res, next);
            } catch (e) {
                if (res.headersSent) {
                    console.log("headers were sent before we could catch the error: " + e.message);
                } else {
                    res.status(500).send({
                        success: false,
                        message: e.message + "\n" + e.stack,
                    });
                }
            }
        }
    };
}
