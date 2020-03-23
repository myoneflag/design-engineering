import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {ChangeLogMessage} from "../../../common/src/models/ChangeLogMessage";
import {Session} from "../../../common/src/models/Session";
import { AccessLevel, User } from "../../../common/src/models/User";
import { MoreThan } from 'typeorm';


export class ChangeLogMessageController {
    
    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async submitChangeLogMessage(req: Request, res: Response, next: NextFunction, session: Session) {
        const changeLog = ChangeLogMessage.create();
        changeLog.message = req.body.message;
        changeLog.submittedBy = session.user;
        changeLog.tags = req.body.tags;
        changeLog.version = req.body.version;
        changeLog.createdOn = new Date();
        let result = await changeLog.save({reload: true});
        res.status(200).send({
            success: true,
            data: changeLog,
        });
    }

    @ApiHandleError()
    public async getChangeLogMessages(req: Request, res: Response, next: NextFunction) {
        let results: ChangeLogMessage[] = [];
        try{
            if (req.query.lastNoticeSeen === null || req.query.lastNoticeSeen === undefined){
                results = await ChangeLogMessage.find({order: {createdOn: "DESC"}});
            }
            else{
                const lastNoticeSeen: Date = new Date(req.query.lastNoticeSeen);
                results = await ChangeLogMessage.find({where: {createdOn: MoreThan(lastNoticeSeen)}, order: {createdOn: "DESC"}})
            }
        }
        catch(e){
            console.log(e)
        }
        for(let r of results){
            if (r.submittedBy !== null){
                r.submittedBy = {username: r.submittedBy.username, name: r.submittedBy.name, accessLevel: r.submittedBy.accessLevel} as unknown as User
            }
        }
        res.status(200).send({
            success: true,
            data: results,
        })
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async updateLastNoticeSeenOn(req: Request, res: Response, next: NextFunction, session: Session) {
        try{
        let user = session.user;
        user.lastNoticeSeenOn = new Date();
        await user.save();
        res.status(200).send({
            success: true,
            data: user,
        });}
        catch(e){
            console.log(e);
        }
    }
}

const router = Router();
const controller = new ChangeLogMessageController();

router.post('/', controller.submitChangeLogMessage.bind(controller));
router.get('/', controller.getChangeLogMessages);
router.get('/updateNotice', controller.updateLastNoticeSeenOn.bind(controller));

export const changeLogMessageRouter = router;
