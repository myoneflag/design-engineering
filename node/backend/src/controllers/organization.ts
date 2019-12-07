import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import {ApiHandleError} from "../helpers/apiWrapper";
import {AuthRequired} from "../helpers/withAuth";
import {AccessLevel} from "../entity/User";
import {Organization} from "../entity/Organization";
import {AccessType, withOrganization, withUser} from "../helpers/withResources";
import {LoginController} from "./login";

export class OrganizationController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async create(req: Request, res: Response, next: NextFunction, session: Session) {
        const {id, name} = req.body;

        if (await Organization.findOne({id})) {
            res.status(400).send({
                success: false,
                message: "Organization with that ID already exists",
            });
            return;
        }

        const org = Organization.create();
        org.id = id;
        org.name = name;
        await org.save();
        res.status(200).send({
            success: true,
            data: org,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withOrganization(req.params.id, res, session, AccessType.READ, async (org) => {
            res.status(200).send({
                success: true,
                data: org,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        const allOrgs = await Organization.find();
        res.status(200).send({
            success: true,
            data: allOrgs,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        await withOrganization(req.params.id, res, session, AccessType.UPDATE,  async (target) => {
            const {name} = req.body;
            target.name = name;
            await target.save();
            res.status(200).send({
                success: true,
                data: target,
            });
            return;
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async delete(req: Request, res: Response, next: NextFunction, session: Session) {
        await withOrganization(req.params.id, res, session, AccessType.DELETE,  async (del) => {
            await del.remove();
            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }
}

const router = Router();
const controller = new OrganizationController();

// Retrieve all Users
router.post('/', controller.create.bind(controller));
router.get('/:id', controller.findOne.bind(controller));
router.get('/', controller.find.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export const organizationRouter = router;