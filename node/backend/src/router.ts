import { Router } from 'express';
import {catalogRouter} from './controllers/catalog';
import {loginRouter} from './controllers/login';
import {documentRouter} from './controllers/document';

import 'express-ws';
import {contactRouter} from "./controllers/contact";
import {pdfRouter} from "./controllers/pdf";
import {organizationRouter} from "./controllers/organization";
import {usersRouter} from "./controllers/users";
import {errorRouter} from "./controllers/error";
import { accessEvents } from "./controllers/access-events";

const router: Router = Router();

router.use('/catalog', catalogRouter);
router.use('/', loginRouter);
router.use('/documents', documentRouter);
router.use('/contacts', contactRouter);
router.use('/uploadPdf', pdfRouter);
router.use('/organizations', organizationRouter);
router.use('/users', usersRouter);
router.use('/accessEvents', accessEvents);
router.use('/errors', errorRouter);

export default router;
