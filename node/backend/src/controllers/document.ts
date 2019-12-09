import {AuthRequired, withAuth} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {OperationTransformConcrete} from "../../../frontend/src/store/document/operation-transforms/operation-transforms";
import {Operation} from "../entity/Operation";
import {DocumentWSMessage, DocumentWSMessageType} from "../../../common/src/api/types";
import {Document} from "../entity/Document";
import {Session} from "../entity/Session";
import {ApiHandleError} from "../helpers/apiWrapper";
import {AccessLevel, User} from "../entity/User";
import {AccessType, withDocument, withOrganization} from "../helpers/withResources";
import {initialDocumentState} from "../../../frontend/src/store/document/types";
import {Catalog} from "../entity/Catalog";
import * as initialCatalog from "../initial-catalog.json";
import {Catalog as ICatalog} from "../../../frontend/src/store/catalog/types";

export class DocumentController {
    @ApiHandleError()
    @AuthRequired()
    public async reset(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.DELETE, async (doc) => {
            if (updateHandlers.has(doc.id)) {
                const allTasks = updateHandlers.get(doc.id)!.map(async (fn) => {
                    return fn(true);
                });

                try {
                    await Promise.all(allTasks);
                } catch (e) {
                    console.log('error: exception while deleting all existing sockets ' + e.message);
                }
            }
            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async create(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        const userWithOrg = await User.findOne({username: user.username}, {relations: ['organization']});
        const org = userWithOrg.organization;
        if (user.accessLevel >= AccessLevel.MANAGER) {
            // We can only create in our own org.
            if (org === undefined || req.body.organization !== org.id) {
                res.status(401).send({
                    success: false,
                    message: "You can only create documents in your own organization. You are in " + (org ? org.id : "no organization"),
                });
                return;
            }
        }

        let qorg = req.body.organization;
        if (!qorg && org) {
            qorg = org.id;
        }

        console.log('query org id: ' + qorg);

        await withOrganization(qorg, res, session, AccessType.READ, async (org) => {
            const doc = Document.create();
            doc.organization = Promise.resolve(org);
            doc.createdBy = user;
            doc.createdOn = new Date();
            doc.metadata = initialDocumentState.drawing.generalInfo;


            const catalog = Catalog.create();
            catalog.content = initialCatalog as ICatalog;
            catalog.savedOn = new Date();
            catalog.document = Promise.resolve(doc);
            await doc.save();
            await catalog.save();

            res.status(200).send({
                success: true,
                data: doc,
            });
        })
    }

    @ApiHandleError()
    @AuthRequired()
    public async delete(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.DELETE, async (doc) => {
            if (updateHandlers.has(doc.id)) {
                const allTasks = updateHandlers.get(doc.id)!.map(async (fn) => {
                    return fn(true);
                });

                try {
                    await Promise.all(allTasks);
                } catch (e) {
                    console.log('error: exception while deleting all existing sockets ' + e.message);
                }

                updateHandlers.delete(doc.id);
                operationQueues.delete(doc.id);
            }

            const catalog = await Catalog.findOne({where: {id: doc.id}, relations: ['document']});

            await catalog.remove();
            await doc.remove();
            res.status(200).send({
                success: true,
                data: null,
            });
        })
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.UPDATE, async (doc) => {
            const {organization, metadata} = req.body;

            if (organization !== undefined) {
                let called = false;
                await withOrganization(organization, res, session, AccessType.UPDATE, async (org) => {
                    called = true;
                    doc.organization = Promise.resolve(org);
                });
                if (!called) {
                    return;
                }
            }

            if (metadata !== undefined) {
                doc.metadata = metadata;
            }

            await doc.save();
            res.status(200).send({
                success: true,
                data: doc,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        // find only the ones we care about.
        let results: Document[];
        const access = (await session.user).accessLevel;
        if (access >= AccessLevel.MANAGER) {
            // we can only access our own org.
            const user = await session.user;
            await user.reload();
            const org = user.organization;

            if (org == null) {
                results = [];
            } else {
                results = await Document
                    .createQueryBuilder('document')
                    .where('document.organization = :organization', {organization: org.id})
                    .orderBy('document.createdOn', 'DESC')
                    .getMany();
            }
            await Promise.all(results.map((r) => r.reload()));
        } else {
            console.log('getting all documents');
            results = await Document.find( {order: {'createdOn' : 'DESC'}});
        }

        res.status(200).send({
            success: true,
            data: results,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            res.status(200).send({
                success: true,
                data: doc,
            });
        });
    }
}

let operationQueues = new  Map<number, OperationTransformConcrete[][]>();
let isLoading = new Set<number>();
let loadingFinishedCallbacks = new Map<number, Array<() => Promise<any>>>();

export type OperationUpdateHandler = (deleted: boolean) => Promise<any>;
let updateHandlers = new Map<number, OperationUpdateHandler[]>();

async function ensureDocumentLoaded(id: number) {

    // If another thread is already loading this document, wait in line and return when they finished.
    if (isLoading.has(id)) {
        return new Promise((res, rej) => {
            loadingFinishedCallbacks.get(id)!.push(async () => {
                res();
            })
        });
    }

    if (!operationQueues.has(id)) {

        isLoading.add(id);
        loadingFinishedCallbacks.set(id, []);

        const operationQueue: OperationTransformConcrete[] = [];

        const operations = await Operation
            .createQueryBuilder('operation')
            .where('operation.document = :document', {document: id})
            .orderBy('operation.orderIndex', 'ASC')
            .getMany();


        operations.forEach((o) => {
            operationQueue.push(JSON.parse(o.operation));
        });
        operationQueues.set(id, [operationQueue]);
        isLoading.delete(id);

        // Tell other early birds that I did the hard work of loading the document and now they can resume.
        await Promise.all(loadingFinishedCallbacks.get(id)!.map((fn) => {
            fn();
        }));
        loadingFinishedCallbacks.delete(id);
    }
}

async function receiveOperations(id: number, ops: OperationTransformConcrete[]) {
    if (ops.length === 0) {
        return;
    }
    if (!operationQueues.has(id)) {
        throw new Error('document ' + id + ' has no operation queue, it must be initialized before.');
    }
    const oq = operationQueues.get(id)!;
    let firstId = 0;
    if (operationQueues.get(id)!.length) {
        firstId = oq[oq.length - 1][oq[oq.length - 1].length - 1].id + 1;
    }
    ops.forEach((o) => {
        o.id = firstId;
        firstId += 1;
    });
    oq.push(ops);


    const doc = await Document.findOne({id});

    await Promise.all(ops.map((op) => {
        const toStore = Operation.create();
        toStore.document = Promise.resolve(doc);

        toStore.operation = JSON.stringify(op);
        toStore.orderIndex = op.id;
        return toStore.save();
    }));

    const uh = updateHandlers.get(id)!;
    await Promise.all(uh.map((fn) => {
        try {
            return fn(false);
        } catch (e) {
            console.log("error updating operation: " + e.message);
        }
    }));
}


const router = Router();
const controller = new DocumentController();

router.ws('/:id/websocket', (ws, req) => {


    const pingPid = setInterval(function timeout() {
        ws.ping("heartbeat");
    }, 500);

    console.log('connected to id ' + req.params.id);
    withAuth(req, async (session) => {
            withDocument(Number(req.params.id), null, session, AccessType.UPDATE, async (doc) => {

                let upTo = 0;

                const onUpdate = async (deleted: boolean) => {
                    if (deleted) {
                        const msg: DocumentWSMessage = [{
                            type: DocumentWSMessageType.DOCUMENT_DELETED,
                        }];
                        await ws.send(JSON.stringify(msg));
                        await ws.close();
                        return;
                    }

                    const oq = operationQueues.get(doc.id)!;

                    const msg: DocumentWSMessage = [];
                    for (; upTo < oq.length; upTo) {
                        const toSend = oq[upTo++];
                        toSend.forEach((op) => {
                            msg.push({
                                operation: op, type: DocumentWSMessageType.OPERATION,
                            });
                        });
                    }
                    await ws.send(JSON.stringify(msg));
                };

                let uh: OperationUpdateHandler[] = [];
                if (updateHandlers.has(doc.id)) {
                    uh = updateHandlers.get(doc.id)!;
                } else {
                    updateHandlers.set(doc.id, uh);
                }


                ws.on('close', () => {

                    const toRemove = uh.indexOf(onUpdate);
                    console.log('closed and removing ' + toRemove);
                    uh.splice(toRemove, 1);
                    clearInterval(pingPid);
                    operationQueues.delete(doc.id);
                });

                uh.push(onUpdate);
                await ensureDocumentLoaded(doc.id);


                // We can afford to move this later (we need it after ensureDocumentLoaded) because users are not
                // expected to start giving us messages until after the document is loaded.
                ws.on('message', message => {
                    // received operations
                    const ops: OperationTransformConcrete[] = JSON.parse(message as string);
                    receiveOperations(doc.id, ops);
                });


                await onUpdate(false);

                const msg: DocumentWSMessage = [{
                    type: DocumentWSMessageType.DOCUMENT_LOADED,
                }];
                await ws.send(JSON.stringify(msg));
            });
        },
        (msg) => {
            ws.send('You are not authorised');
            ws.send(msg);
        });
});

router.post('/reset', controller.reset.bind(controller));

router.post('/', controller.create.bind(controller));
router.delete('/', controller.delete.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.get('/:id', controller.findOne.bind(controller));
router.get('/', controller.find.bind(controller));

export const documentRouter = router;

