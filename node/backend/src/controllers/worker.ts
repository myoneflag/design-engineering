
import { Request, Response, Router } from "express";
import { DocumentUpgrader, Tasks } from "../services/DocumentUpgrader";

export class WorkerController {
    public async processQueueMessage(req: Request, res: Response) {
        const jsonMessage = req.body;
        console.log("worker.message", jsonMessage)

        let docId: number;
        try {
            switch (jsonMessage.task) {
                case Tasks.DocumentUpgradeScan:
                    console.log("worker.task", jsonMessage.task )                    
                    await DocumentUpgrader.submitDocumentsForUpgrade()
                    break
                case Tasks.DocumentUpgradeExecute:
                    docId = req.body.parameters.docId
                    console.log("worker.task", jsonMessage.task, { docId } )
                    await DocumentUpgrader.onDocumentUpgradeRequest(docId);
                    break;
                default:
                    console.log("worker.unkownMessage")
            }
            return res.status(200).send({success: true});            
        } catch (err) {
            console.log("worker.error", jsonMessage.task, { docId } )
            console.error(err)
            return res.status(500).send({success: false})
        }
    }
}

const router: Router = Router();
const controller = new WorkerController();

// process incoming worker messages
router.post('/workermessage', controller.processQueueMessage.bind(controller));

export const workerRouter = router;
