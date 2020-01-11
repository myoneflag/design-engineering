import {NextFunction, Request, Response} from "express";
import {Session} from "../entity/Session";

export function ApiHandleError() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;
        descriptor.value = async (req: Request, res: Response, next: NextFunction) => {
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
