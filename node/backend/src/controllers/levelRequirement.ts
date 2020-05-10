import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {VideoViewedRecord} from "../../../common/src/models/VideoViewedRecord";
import {Video} from "../../../common/src/models/Video";
import {Level, LevelName} from "../../../common/src/models/Level";
import { AccessLevel } from "../../../common/src/models/User";
import { Session } from "../../../common/src/models/Session";
import { Document } from "../../../common/src/models/Document";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";
import { RequirementType, Requirement } from "../../../common/src/models/Requirement";
import { ConcreteLevels, NoviceRequirements, BeginnerRequirements} from "../../../common/src/api/concreteLevels";
import { getManager } from 'typeorm';

export class LevelRequirementController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async getLevelAndRequirements(req: Request, res: Response, next: NextFunction, session: Session) {
        let ret = {
            currentLevel: LevelName.NOVICE,
            currentRequirements: [],
            tickedRequirements: []
        }
        try{
            const viewHistory = await VideoViewedRecord.find({where:{watchedBy: session.user.username, completed: true }, order: {timeStamp: "ASC"}});
            let levelRequirements = await Level.find();
            //temporary hack
            console.log(levelRequirements.length);
            if (levelRequirements.length===0){
                for (let i of ConcreteLevels){
                    const level = Level.create();
                    level.name = i.name;
                    await level.save();
                    if (i.name===LevelName.NOVICE){
                        for (let j of NoviceRequirements){
                            if (j.type===RequirementType.VIDEO){
                                console.log('ever here?');
                                try {
                                    const r = Requirement.create();
                                    r.numFeedback = j.numFeedback;
                                    r.numProjectStarted = j.numProjectStarted;
                                    r.type = j.type;
                                    r.level = level;
                                    r.video = await Video.findOne({where: {titleId: j.videoTitleId}});
                                    console.log(r);
                                    await r.save();
                                }   
                                catch(e){
                                    console.log('save video error');
                                    console.log(e);
                                }                             
                            }
                            else{
                                try{
                                    const r = Requirement.create();
                                    r.numFeedback = j.numFeedback;
                                    r.numProjectStarted = j.numProjectStarted;
                                    r.type = j.type;
                                    r.level = level;
                                    r.video = null;
                                    console.log(r);
                                    await r.save();
                                }
                                catch(e){
                                    console.log('save requirement error');
                                    console.log(e);
                                }
                            }
                        }
                    }
                    else if (i.name===LevelName.BEGINNER){
                        for (let j of BeginnerRequirements){
                            if (j.type===RequirementType.VIDEO){
                                try{
                                    const r = Requirement.create();
                                    r.numFeedback = j.numFeedback;
                                    r.numProjectStarted = j.numProjectStarted;
                                    r.type = j.type;
                                    r.level = level;
                                    r.video = await Video.findOne({where: {titleId: j.videoTitleId}});
                                    console.log(r);
                                    await r.save();
                                }
                                catch(e){
                                    console.log('save video error');
                                    console.log(e);
                                }                                
                            }
                            else{
                                try{
                                    const r = Requirement.create();
                                    r.numFeedback = j.numFeedback;
                                    r.numProjectStarted = j.numProjectStarted;
                                    r.type = j.type;
                                    r.level = level;
                                    r.video = null;
                                    console.log(r);
                                    await r.save();
                                }
                                catch(e){
                                    console.log('save requirement error');
                                    console.log(e);
                                }
                            }
                        }
                    }
                }
            }
            levelRequirements = await Level.find();
            //end of temporary hack
            console.log(levelRequirements);
            const userDocument = await Document.find({where:{createdBy: session.user.username}});
            const userFeedback = await FeedbackMessage.find({where:{submittedBy: session.user.username}});
            let currentLevel = LevelName.NOVICE;
            let currentRequirements = [];
            let tickedRequirements = [];
            for (let level of levelRequirements){
                const requirements = await Requirement.find({where:{level: level.levelId}});
                if (requirements){
                    currentRequirements = requirements;
                    console.log('level has requirements');
                    for (let requirement of requirements){
                        if (requirement.type === RequirementType.NUM_FEEDBACK){
                            if (userFeedback.length > requirement.numFeedback){
                                tickedRequirements.push(requirement);
                            }
                            if (userDocument.length > requirement.numProjectStarted){
                                tickedRequirements.push(requirement);
                            }
                            if (requirement.video){
                                for (let view of viewHistory){
                                    if (view.video.titleId = requirement.video.titleId){
                                        tickedRequirements.push(requirement);
                                    }
                                }
                            }
                        }
                    }
                    if (currentRequirements.length === tickedRequirements.length){
                        currentLevel = level.name;
                    }
                    else{
                        break;
                    }
                }
                else{
                    currentLevel = level.name;
                }
            }
            ret.currentLevel = currentLevel;
            ret.currentRequirements = currentRequirements;
            ret.tickedRequirements = tickedRequirements;
        }
        catch(e){
            console.log(e)
        }
        console.log(ret);
        res.status(200).send({
            success: true,
            data: ret,
        })
    }
}

const router = Router();
const controller = new LevelRequirementController();

router.get('/', controller.getLevelAndRequirements.bind(controller));
export const LevelRequirementRouter = router;
