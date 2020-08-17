import { Router, Request, Response, NextFunction } from 'express';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { Session } from '../../../common/src/models/Session';
import { HotKey } from '../../../common/src/models/HotKey';

export class HotKeyController {
    @ApiHandleError()
    @AuthRequired()
    public async getSetting(req: Request, res: Response) {
        const hotKey = await HotKey.findOne(req.params.id, {select: ["setting"]});

        res.send({
            success: true,
            data: hotKey && hotKey.setting || ''
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async post(req: Request, res: Response, next: NextFunction, session: Session) {
        const hotKey = HotKey.create();
        hotKey.setting = req.body.setting;
        await hotKey.save();
        const user = session.user;
        user.hot_key = hotKey;
        await user.save();

        res.send({
            success: true,
            data: {
                user: user,
                setting: hotKey.setting,
            }
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response) {
        const hotKey = await HotKey.findOne(req.params.id);
        hotKey.setting = req.body.setting;
        await hotKey.save();

        res.send({
            success: true,
            data: hotKey.setting,
        });
    }
}

const router = Router();
const controller = new HotKeyController();

router.get("/setting/:id", controller.getSetting.bind(controller));
router.post('/', controller.post.bind(controller));
router.put('/:id', controller.update.bind(controller));

export const hotKeyRouter = router;
