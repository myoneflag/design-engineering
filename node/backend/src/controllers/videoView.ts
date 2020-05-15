import { NextFunction, Request, Response, Router } from "express";
import { Session } from "../../../common/src/models/Session";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import { AccessLevel } from "../../../common/src/models/User";
import { VideoView } from "../../../common/src/models/VideoView";

export class VideoViewController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        const result = await VideoView.findOne({id: Number(req.params.id)});
        if (result) {
            if (result.user.username !== session.user.username) {
                return res.status(404).send({
                    success: false,
                    message: 'Video View record not found',
                });
            } else {
                return res.status(200).send({
                    success: true,
                    data: result,
                });
            }
        } else {
            return res.status(404).send({
                success: false,
                message: 'Video View record not found',
            });
        }
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        let result: VideoView[] = [];
        if (session.user.accessLevel > AccessLevel.ADMIN) {
            result = await VideoView.createQueryBuilder('videoView')
                .where('videoView.user = :user', {user: session.user.username})
                .getMany();
        } else {
            result = await VideoView.find();
        }

        return res.status(200).send({
            success: true,
            data: result,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async delete(req: Request, res: Response, next: NextFunction, session: Session) {
        let target = await VideoView.findOne({id: Number(req.params.id)});

        if (session.user.accessLevel > AccessLevel.ADMIN) {
            if (target && target.user.username !== session.user.username) {
                target = undefined;
            }
        }

        if (target) {
            await target.remove();
            return res.status(200).send({
                success: true,
            });
        } else {
            return res.status(404).send({
                success: false,
                message: "Video View record not found",
            });
        }
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async recordVideoView(req: Request, res: Response, next: NextFunction, session: Session) {
        const videoId = req.body.videoId;
        const obj = new VideoView();
        obj.user = session.user;
        obj.completed = true;
        obj.timeStamp = new Date();
        obj.videoId = videoId;

        await obj.save();
        await obj.reload();

        return res.status(200).send({
            success: true,
            data: obj,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async viewedVideoIds(req: Request, res: Response, next: NextFunction, session: Session) {
        const uniqueViews = await VideoView.createQueryBuilder('videoView')
            .select('DISTINCT ON (videoView.videoId)')
            .where('videoView.user = :user', { user: session.id })
            .getMany();
        const videoIds = uniqueViews.map((uv) => uv.videoId);
        return res.status(200).send({
            success: true,
            data: videoIds,
        });
    }
}

const router = Router();
const controller = new VideoViewController();

// Retrieve all Users
router.get('/:id', controller.findOne.bind(controller));
router.get('/', controller.find.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.post('/recordVideoView', controller.recordVideoView.bind(controller));
router.get('/viewedVideoIds', controller.viewedVideoIds.bind(controller));

export const videoViewRouter = router;
