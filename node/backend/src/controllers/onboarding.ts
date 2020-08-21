import { Request, Response, Router } from 'express';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { Onboarding } from '../../../common/src/models/Onboarding';

export class OnboardingController {
    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response) {
        const onboarding = await Onboarding.findOne(req.params.id);

        if (req.body.home) {
            onboarding.home = 1;
        }

        if (req.body.document) {
            onboarding.document = 1;
        }

        if (req.body.document_plumbing) {
            onboarding.document_plumbing = 1;
        }

        if (req.body.document_setting) {
            onboarding.document_setting = 1;
        }

        await onboarding.save();

        res.send({
            success: true,
            data: onboarding,
        });
    }
}

const router = Router();
const controller = new OnboardingController();

router.put("/:id", controller.update.bind(controller));

export const onboardingRouter = router;
