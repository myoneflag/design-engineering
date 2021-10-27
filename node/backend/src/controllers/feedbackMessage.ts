import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {FeedbackCategory, FeedbackMessage} from "../../../common/src/models/FeedbackMessage";
import {Session} from "../../../common/src/models/Session";
import { AccessLevel } from "../../../common/src/models/User";
import { NodeMailerTransporter } from '../nodemailer';
import Config from "../config/config";

async function sendToMailingList(feedback: FeedbackMessage) {

    const emailDestination = feedback.category === FeedbackCategory.Bug ? 
        Config.BUGS_EMAIL : Config.FEEDBACK_EMAIL;

    const mailOptions = {
        from: Config.DEFAULT_EMAIL_FROM,
        to: emailDestination,
        subject: `New H2X ${feedback.category} Submission`,
        html:
            `<p><b>From:</b> ${feedback.submittedBy.name} (@${feedback.submittedBy.username})</p>
             <p><b>Email:</b> <a href="mailto:${feedback.submittedBy.email}">${feedback.submittedBy.email}</a></p>
             <p><b>Category:</b> ${feedback.category}</p>
             <p><b>Document:</b> ${feedback.document.id ? feedback.document.id : "n/a"} <a href="${feedback.document.url}" target="_blank">${feedback.document.url}</a></p>
             <p><b>Message:</b> ${feedback.message}</p>`,
    };

    return NodeMailerTransporter.sendMail(mailOptions);
}

export class FeedbackMessageController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async submitFeedbackMessage(req: Request, res: Response, next: NextFunction, session: Session) {
        const feedback = FeedbackMessage.create();
        feedback.message = req.body.message;
        feedback.document = req.body.document ? {
                id: req.body.document.id,
                url: req.body.document.url,
            } : null;
        feedback.submittedBy = session.user;
        feedback.category = req.body.category;
        feedback.createdOn = new Date();
        await feedback.save();
        sendToMailingList(feedback);
        res.status(200).send({
            success: true,
            data: feedback,
        });
    }
}

const router = Router();
const controller = new FeedbackMessageController();

router.post('/', controller.submitFeedbackMessage.bind(controller));

export const feedbackMessageRouter = router;
