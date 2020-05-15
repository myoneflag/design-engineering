import { AuthRequired } from "../helpers/withAuth";
import { NextFunction, Request, Response, Router } from "express";
import { ApiHandleError } from "../helpers/apiWrapper";
import { Level } from "../../../common/src/models/Level";
import { AccessLevel } from "../../../common/src/models/User";
import { Session } from "../../../common/src/models/Session";
import { Document } from "../../../common/src/models/Document";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";
import { Video } from "../../../common/src/models/Video";
import { VideoViewedRecord } from "../../../common/src/models/VideoViewedRecord";

export class LevelController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async getLevels(req: Request, res: Response, next: NextFunction, session: Session) {
        const data = await Level.find({order: {order: 'ASC'}});
        return res.status(200).send({
            success: true,
            data,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async getLevel(req: Request, res: Response, next: NextFunction, session: Session) {
        const data = await Level.findOne(Number(req.params.id));
        if (data) {
            return res.status(200).send({
                success: true,
                data,
            });
        } else {
            return res.status(404).send({
                success: false,
                message: "cannot find level",
            });
        }
    }
}

const router = Router();
const controller = new LevelController();

router.get("/", controller.getLevels.bind(controller));
router.get("/:id", controller.getLevel.bind(controller));
export const LevelRequirementRouter = router;
