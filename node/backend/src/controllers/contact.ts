import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {allContactMessageColumns, ContactMessage} from "../entity/ContactMessage";
import * as NodeMailer from 'nodemailer';
import {AccessLevel, User} from "../entity/User";
import {Session} from "../entity/Session";
import {getConnection, LessThanOrEqual} from "typeorm";

async function sendToSubscribers(contact: ContactMessage) {

    const transporter = NodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'h2xnoreply@gmail.com',
            pass: 'thisistemporaryomg',
        }
    });

    const subscribers = await User.find({where: {subscribed: true, accessLevel: LessThanOrEqual(AccessLevel.ADMIN)}});


    return await Promise.all(subscribers.map((s) => {
        if (s.email) {

            const mailOptions = {
                from: 'h2xnoreply@gmail.com',
                to: s.email,
                subject: 'New H2X Contact Submission',
                html: "<p>Hi " + s.name + ", here's a new contact message from the page at h2x.maxwu.cloud/contact</p>" +
                    "<p><b>From:</b><br> " + contact.name + "</p>" +
                    "<p><b>Email:</b><br> " + contact.email + "</p>" +
                    "<p><b>Message:</b><br> " + contact.message + "</p>" +
                    "<p>(This was automatically relayed from the server)</p>" +
                    "<p>(Please log in to the platform and change your profile setting if you don't want these emails anymore)</p>"
            };

            console.log("Sending to " + s.email);

            return transporter.sendMail(mailOptions);
        } else {
            console.log("Want to send to user " + s.username + " but they have no email");
        }

    }));
}

export class ContactController {
    @ApiHandleError()
    public async submitContact(req: Request, res: Response, next: NextFunction) {
        const contact = ContactMessage.create();
        contact.email = req.body.email;
        contact.message = req.body.message;
        contact.name = req.body.name;
        contact.sentOn = new Date();
        contact.ip = req.ip;

        await contact.save({reload: true});

        sendToSubscribers(contact);

        res.status(200).send({
            success: true,
            data: contact,
        });
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async getContacts(req: Request, res: Response, next: NextFunction, session: Session) {
        const contacts = await ContactMessage.find({order: {sentOn: "DESC"}, select: allContactMessageColumns()});
        res.status(200).send({
            success: true,
            data: contacts,
        })
    }
}

const router = Router();
const controller = new ContactController();

router.post('/', controller.submitContact);
router.get('/', controller.getContacts.bind(controller));

export const contactRouter = router;
