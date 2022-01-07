import {AuthRequired, withAuth} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {AccessLevel} from "../../../common/src/models/User";
import {Session} from "../../../common/src/models/Session";
import {ErrorReport, ErrorStatus} from "../../../common/src/models/Error";
import {CreateErrorRequest} from "../models/Error";

export class ErrorController {
    @ApiHandleError()
    public async create(req: Request, res: Response, next: NextFunction) {
        async function createError(session?: Session) {
            const body: CreateErrorRequest = req.body;

            const err = ErrorReport.create();

            err.appVersion = body.appVersion;
            err.message = body.message;
            err.trace = body.trace;
            err.threwOn = body.threwOn;
            err.appVersion = body.appVersion;
            err.name = body.name;
            err.url = body.url;

            err.ip = req.ip;
            if (session) {
                const user = await session.user;
                await user.reload();
                err.user = user;
            }

            err.status = ErrorStatus.NEW;

            await err.save();

            console.error(JSON.stringify(err));

            return err;
        }

        const error = await withAuth(req, (s) => createError(s), () => createError());

        res.status(200).send({
            success: true,
            data: error,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.SUPERUSER)
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        const error = await ErrorReport.findOne({id: Number(req.params.id)});
        if (!error) {
            res.status(404).send({
                success: false,
                message: "error not found",
            });
            return ;
        }
        res.status(200).send({
            success: true,
            data: error,
        });
    }

    // Error stack traces are updated with a follow up call. Restrict USER => MANAGER's to only updating that.
    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        const {status, trace} = req.body;

        const error = await ErrorReport.findOne({id: Number(req.params.id)});
        if (!error) {
            res.status(404).send({
                success: false,
                message: "error not found",
            });
            return ;
        }

        if (status) {
            error.status = status;
        }

        if (trace) {
            error.trace = trace;
        }

        await error.save();
        res.status(200).send({
            success: true,
            data: error,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.SUPERUSER)
    public async findAll(req: Request, res: Response, next: NextFunction, session: Session) {
        const statuses: ErrorStatus[] = req.query.statuses;
        const from = req.query.from || 0;
        const count = req.query.count || Infinity;

        const filter = statuses ? statuses.map((s) => ({status: s})) : [];

        const errors = await ErrorReport.find({order: {threwOn: "DESC"}, where: filter, skip: from, take: count});
        res.status(200).send({
            success: true,
            data: errors,
        });
    }
}

const router = Router();
const controller = new ErrorController();

router.post('/', controller.create);
router.get('/:id', controller.findOne.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.get('/', controller.findAll.bind(controller));

export const errorRouter = router;
