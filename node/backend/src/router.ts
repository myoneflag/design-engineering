import 'express-ws';
import { Router } from 'express';
import { shareDocumentRouter } from './controllers/shareDocument';
import {catalogRouter} from './controllers/catalog';
import {loginRouter} from './controllers/login';
import {documentRouter} from './controllers/document';
import {contactRouter} from "./controllers/contact";
import {changeLogMessageRouter} from './controllers/changeLogMessage';
import {pdfRouter} from "./controllers/pdf";
import {organizationRouter} from "./controllers/organization";
import {usersRouter} from "./controllers/users";
import {errorRouter} from "./controllers/error";
import { accessEvents } from "./controllers/access-events";
import {feedbackMessageRouter} from './controllers/feedbackMessage';
import { videoViewRouter } from "./controllers/videoView";
import { hotKeyRouter } from './controllers/hotKey';
import { onboardingRouter } from './controllers/onboarding';

const router: Router = Router();

router.use('/catalog', catalogRouter);
router.use('/', loginRouter);
router.use('/documents', documentRouter);
router.use('/changeLogMessage', changeLogMessageRouter);
router.use('/contacts', contactRouter);
router.use('/uploadPdf', pdfRouter);
router.use('/organizations', organizationRouter);
router.use('/users', usersRouter);
router.use('/accessEvents', accessEvents);
router.use('/errors', errorRouter);
router.use('/feedback', feedbackMessageRouter);
router.use('/videoView', videoViewRouter);
router.use('/shareDocument', shareDocumentRouter);
router.use('/hotKey', hotKeyRouter);
router.use('/onboarding', onboardingRouter);

export default router;
