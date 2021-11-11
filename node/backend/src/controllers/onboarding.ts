import { Request, Response, Router } from 'express';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { Onboarding } from '../../../common/src/models/Onboarding';

export class OnboardingController {
    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response) {
        const onboarding = await Onboarding.findOne(req.params.id);

        for(const key in req.body){
            onboarding[key] = req.body[key];
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
