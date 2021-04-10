
import { Request, Response, Router } from "express";

export class WorkerController {
    public async processQueueMessage(req: Request, res: Response) {
        const jsonMessage = req.body;
        console.log("Worker Message Received")
        console.log(jsonMessage)
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
