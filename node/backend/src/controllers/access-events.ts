import { NextFunction, Request, Response, Router } from "express";
import { AccessEvents } from "../entity/AccessEvents";
import { Organization } from "../entity/Organization";
import { Session } from "../entity/Session";
import { AccessLevel, User } from "../entity/User";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import { AccessType, withOrganization, withUser } from "../helpers/withResources";
import { registerUser } from "./login";

export class AccessEventsController {
    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        let result: AccessEvents[];
        const from = req.query.from || 0;
        const count = req.query.count || Infinity;

        console.log(from, count);

        if (req.query.username) {
            result = await AccessEvents
                .createQueryBuilder('access_events')
                .where('access_events.user = :username', {username: req.query.username})
                .orWhere('username = :username', {username: req.query.username})
                .orderBy('"dateTime"', "DESC")
                .skip(from)
                .take(count)
                .getMany();
        } else {
            result = await AccessEvents
                .createQueryBuilder('access_events')
                .orderBy('"dateTime"', "DESC")
                .skip(from)
                .take(count)
                .getMany();
        }

        res.status(200).send({
            success: true,
            data: result,
        });
    }
}

const router = Router();
const controller = new AccessEventsController();

// Retrieve all Users
router.get('/', controller.find.bind(controller));

export const accessEvents = router;
