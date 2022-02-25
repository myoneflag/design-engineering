import {NextFunction, Request, Response} from "express";
import {Session} from "../../../common/src/models/Session";

export function errorResponse(res: Response, error: any, code: number = 500) {
    if (code >= 500) {
        console.error(error.stack || error);
    } else if (code >= 400) {
        console.warn(error.stack || error);
    }
    if (res) {
        res.status(code).send({
            success: false,
            message: error.message || error,
        });
    }
}

export function ApiHandleError() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const original = descriptor.value;
        descriptor.value = async (req: Request, res: Response, next: NextFunction) => {
            try {
                return await original(req, res, next);
            } catch (e) {
                if (res.headersSent) {
                    console.warn("headers were sent before we could catch the error: " + e.message);
                } else {
                    errorResponse(res, e.message);
                }
            }
        };
    };
}
