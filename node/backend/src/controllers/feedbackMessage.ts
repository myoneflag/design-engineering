import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {FeedbackMessage} from "../../../common/src/models/FeedbackMessage";
import {Session} from "../../../common/src/models/Session";
import { AccessLevel, User } from "../../../common/src/models/User";
import { LessThanOrEqual } from "typeorm";
import { NodeMailerTransporter } from '../nodemailer';


async function sendToSubscribers(feedback: FeedbackMessage) {

    const subscribers = await User.find({where: {subscribed: true, accessLevel: LessThanOrEqual(AccessLevel.ADMIN)}});

    return await Promise.all(subscribers.map((s) => {
        if (s.email) {

            const mailOptions = {
                from: process.env.EMAIL_ADDRESS,
                to: s.email,
                subject: 'New H2X Feedback Submission',
                html: "<p>Hi " + s.name + ", here's a new feedback message,</p>" +
                    "<p><b>From:</b><br> " + feedback.submittedBy + "</p>" +
                    "<p><b>Category:</b><br> " + feedback.category + "</p>" +
                    "<p><b>Message:</b><br> " + feedback.message + "</p>" +
                    "<p>(This was automatically relayed from the server)</p>" +
                    "<p>(Please log in to the platform and change your profile setting if you don't want these emails anymore)</p>"
            };

            console.log("Sending to " + s.email);

            return NodeMailerTransporter.sendMail(mailOptions);
        } else {
            console.log("Want to send to user " + s.username + " but they have no email");
        }

    }));
}

export class FeedbackMessageController {
    
    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async submitFeedbackMessage(req: Request, res: Response, next: NextFunction, session: Session) {
        const feedback = FeedbackMessage.create();
        feedback.message = req.body.message;
        feedback.submittedBy = session.user;
        feedback.category = req.body.category;
        feedback.createdOn = new Date();
        let result = await feedback.save({reload: true});
        sendToSubscribers(feedback);
        res.status(200).send({
            success: true,
            data: feedback,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async getFeedbackMessages(req: Request, res: Response, next: NextFunction) {
        let results: FeedbackMessage[] = [];
        try{
            results = await FeedbackMessage.find({order: {createdOn: "DESC"}});
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: results,
        })
    }
}

const router = Router();
const controller = new FeedbackMessageController();

router.post('/', controller.submitFeedbackMessage.bind(controller));
router.get('/', controller.getFeedbackMessages.bind(controller));

export const feedbackMessageRouter = router;
