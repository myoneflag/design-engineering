
import { Request, Response, Router } from "express";
import { DocumentUpgrader, Tasks } from "../services/DocumentUpgrader";

export class WorkerController {
    public async processQueueMessage(req: Request, res: Response) {
        const jsonMessage = req.body;
        console.log("Worker Message Received")
        console.log(jsonMessage)

        switch (jsonMessage.task) {
            case Tasks.DocumentUpgradeScan:
                await DocumentUpgrader.submitDocumentsForUpgrade()
                break
            case Tasks.DocumentUpgradeExecute:
                let docId: number;
                docId = req.body.parameters.docId
                await DocumentUpgrader.onDocumentUpgradeRequest(docId);
                break;
            default:
                console.log("unknown message type")
        }

        return res.status(200).send({
            success: true
        });        
    }
}

const router: Router = Router();
const controller = new WorkerController();

// process incoming worker messages
router.post('/workermessage', controller.processQueueMessage.bind(controller));

export const workerRouter = router;
