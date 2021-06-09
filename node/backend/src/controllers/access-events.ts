import { NextFunction, Request, Response, Router } from "express";
import { AccessEvents } from "../../../common/src/models/AccessEvents";
import { Session } from "../../../common/src/models/Session";
import { AccessLevel } from "../../../common/src/models/User";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";

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
                .orderBy('"dateTimep"', "DESC")
                .skip(from)
                .take(count)
                .getMany();
        }

        res.status(200).send({
            success: true,
            data: result,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async getDataByUsername(req: Request, res: Response) {
        const result = await AccessEvents
            .createQueryBuilder('access_events')
            .where('username = :username', {username: req.params.username})
            .andWhere('type = :type', {type: req.query.type})
            .getMany();

        res.send({
            success: true,
            data: result,
        });
    }
}

const router = Router();
const controller = new AccessEventsController();

router.get('/', controller.find.bind(controller));
router.get('/:username', controller.getDataByUsername.bind(controller));

export const accessEvents = router;
