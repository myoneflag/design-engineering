import {AuthRequired} from "../helpers/withAuth";
import {Catalog} from "../entity/Catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import * as initialCatalog from "../initial-catalog.json";
import {Document} from '../entity/Document';
import {ApiHandleError} from "../helpers/apiWrapper";
import {ContactMessage} from "../entity/ContactMessage";
import * as NodeMailer from 'nodemailer';

export class ContactController {
    @ApiHandleError()
    public async submitContact(req: Request, res: Response, next: NextFunction) {
        const contact = ContactMessage.create();
        contact.email = req.body.email;
        contact.message = req.body.message;
        contact.name = req.body.name;

        await contact.save();

        const transporter = NodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'h2xnoreply@gmail.com',
                pass: 'thisistemporaryomg',
            }
        });

        const mailOptions = {
            from: 'h2xnoreply@gmail.com',
            to: 'jonathanmousdell@gmail.com',
            subject: 'New H2X Contact Submission',
            html: "<p>Hi Jonathan, here's a new contact message from the page at h2x.maxwu.cloud/contact</p>" +
                "<p><b>From:</b><br> " + contact.name + "</p>" +
                "<p><b>Email:</b><br> " + contact.email + "</p>" +
                "<p><b>Message:</b><br> " + contact.message + "</p>" +
                "<p>(This was automatically relayed from the server)</p>"
        };

        transporter.sendMail(mailOptions);
        res.status(200).send({
            success: true,
            data: contact,
        });
    }
}

const router = Router();
const controller = new ContactController();

router.post('/', controller.submitContact);

export const contactRouter = router;
