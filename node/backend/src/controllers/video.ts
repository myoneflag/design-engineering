import {AuthRequired} from "../helpers/withAuth";
import {NextFunction, Request, Response, Router} from "express";
import {ApiHandleError} from "../helpers/apiWrapper";
import {VideoViewedRecord} from "../../../common/src/models/VideoViewedRecord";
import {Video} from "../../../common/src/models/Video";
import {VideoListing} from "../../../common/src/models/VideoListing";
import { AccessLevel, User } from "../../../common/src/models/User";
import { Session } from "../../../common/src/models/Session";
import { decode } from 'punycode';


export class VideoController {

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async getVideo(req: Request, res: Response, next: NextFunction, session: Session) {
        let videoResult = null;
        try{
            console.log('reaching backend ever?');
            console.log(req.query.category);
            console.log(req.query.titleId);
            req.query.category = decodeURI(req.query.category);
            req.query.titleId = decodeURI(req.query.titleId);
            if (req.query.category===''&&req.query.titleId===''){
                const viewHistory = await VideoViewedRecord.findOne({where:{watchedBy: session.user.username }, order: {timeStamp: "DESC"}});
                console.log('getting video backend?');
                if (viewHistory){
                    videoResult = {video: viewHistory.video, startOn: viewHistory.playedTime};
                }
                else{
                    const video = await Video.findOne({where:{titleId: "beginner-1" }});
                    videoResult = {video: video, startOn: 0};
                }
            }
            else if (req.query.category===''&&req.query.titleId!==''){
                const viewHistory = await VideoViewedRecord.find({where:{watchedBy: session.user.username }, order: {timeStamp: "DESC"}});
                let startOn = 0;
                let video = null;
                for (let i of viewHistory){                    
                    if (i.video.titleId===req.query.titleId){
                        startOn = i.playedTime;
                        video = i.video; 
                        break;
                    }
                }
                if (video===null){
                    video = await Video.findOne({where:{titleId: req.query.titleId}});
                }
                console.log('should be here!!');
                console.log(video);
                videoResult = {video: video, startOn: startOn};
            }
            else{
                const viewHistory = await VideoViewedRecord.find({where:{watchedBy: session.user.username }, order: {timeStamp: "DESC"}});
                const videosInCategory = await VideoListing.find({where:{category: req.query.category }, order: {order: "ASC"}});
                let found = false;
                for (let i in viewHistory){
                    if (found){
                        break;
                    }
                    for (let j in videosInCategory){
                        if (viewHistory[i].video.titleId === videosInCategory[j].video.titleId){
                            if (viewHistory[i].completed){
                                let t = Number(j);
                                //if it's last one
                                if (t===videosInCategory.length-1){
                                    videoResult = {
                                        video: viewHistory[i].video,
                                        startOn: viewHistory[i].playedTime
                                    }
                                }
                                else{
                                    videoResult = {
                                        video: videosInCategory[j].video,
                                        startOn: 0,
                                    }
                                }
                            }
                            else {
                                videoResult = {
                                    video: viewHistory[i].video,
                                    startOn: viewHistory[i].playedTime
                                }
                            }
                            found = true;
                        }
                    }
                }
            }
        }
        catch(e){
            console.log('reaching error herer????');
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: videoResult,
        })
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async getAllVideos(req: Request, res: Response, next: NextFunction) {
        let videos = null;
        try{
            videos = await Video.find();
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: videos,
        })
    }

    //need to have a proper think
    // @ApiHandleError()
    // @AuthRequired(AccessLevel.ADMIN)
    // public async removeVideo(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const relatedHistories = await VideoViewedRecord.find({where: {titleId: req.body.titleId}})
    //         const video = await Video.findOne({where:{titleId: req.body.titleId}});
    //         await video.remove()
    //     }
    //     catch(e){
    //         console.log(e)
    //     }
    //     res.status(200).send({
    //         success: true,
    //         data: null,
    //     })
    // }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async addVideoListing(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('video listing woohoo!!!');
            console.log(req.body.titleId);
            console.log(req.body.category);
            const existed = await VideoListing.findOne({where:{video: req.body.titleId, category: req.body.category}})
            console.log(existed);
            if (!existed){
                console.log('not existed!');
                const vl = VideoListing.create()
                const v = await Video.findOne({where:{titleId: req.body.titleId}});
                if (v){
                    vl.video = v;
                    vl.category = req.body.category;
                    vl.order = req.body.order;
                    await vl.save();
                }
            }
            else{
                console.log('not existed!');
                existed.order = req.body.order;
                await existed.save();
            }
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: null,
        })
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async getVideoListing(req: Request, res: Response, next: NextFunction) {
        let listings = null;
        try {
            listings = await VideoListing.find();
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: listings,
        })
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async updateVideo(req: Request, res: Response, next: NextFunction) {
        try {
            const video = await Video.findOne({where:{titleId: req.body.titleId}});
            if (req.body.submitter){
                video.submitter = req.body.submitter
            }
            if (req.body.url){
                video.url = req.body.url;
            }
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: null,
        })
    }

    @ApiHandleError()
    @AuthRequired(AccessLevel.ADMIN)
    public async addVideo(req: Request, res: Response, next: NextFunction, session: Session) {
        let video: Video = null;
        try {
            console.log('add new video woohooo')
            const video = Video.create();
            video.submitter = session.user;
            video.titleId = req.body.titleId;
            video.url = req.body.url;
            video.save();
        }
        catch(e){
            console.log(e)
        }
        res.status(200).send({
            success: true,
            data: video,
        })
    }
    

    @ApiHandleError()
    @AuthRequired(AccessLevel.USER)
    public async addViewHistory(req: Request, res: Response, next: NextFunction, session: Session) {
        let view = await VideoViewedRecord.findOne({where:{video: req.body.titleId, watchedBy: session.user.username, completed: false}, order: {timeStamp: "DESC"}});
        let completedView = await VideoViewedRecord.findOne({where:{video: req.body.titleId, watchedBy: session.user.username, completed: true}, order: {timeStamp: "DESC"}});
        if (view){
            if (req.body.completed){
                await view.remove();
                completedView.timeStamp = new Date();
                await completedView.save();
                console.log('here line 231')
            }
            else{
                view.playedTime = req.body.playedTime;
                view.timeStamp = new Date();
                await view.save();
                console.log('here line 237');
            }
        }
        else{
            if (req.body.completed){
                if (completedView){
                    completedView.timeStamp = new Date();
                    await completedView.save();
                    console.log('here line 245');
                }
                else{
                    completedView = VideoViewedRecord.create();
                    completedView.completed = true;
                    completedView.playedTime = req.body.playedTime;
                    completedView.watchedBy = session.user;
                    completedView.timeStamp = new Date();
                    completedView.video = await Video.findOne({where:{titleId: req.body.titleId}});
                    completedView.save();
                    console.log('here line 255');
                }
            }
            else{
                try{
                    view = VideoViewedRecord.create();
                    view.completed = false;
                    view.playedTime = req.body.playedTime;
                    view.watchedBy = session.user;
                    view.timeStamp = new Date();
                    view.video = await Video.findOne({where:{titleId: req.body.titleId}})
                    view.save();
                    console.log('here line 267');
                }
                catch(e){
                    console.log(e)
                }
            }
        }

        res.status(200).send({
            success: true,
            data: null,
        })
    }
}

const router = Router();
const controller = new VideoController();

router.post('/', controller.addVideo.bind(controller));
router.post('/listing', controller.addVideoListing.bind(controller));
router.post('/history', controller.addViewHistory.bind(controller));
router.get('/', controller.getVideo.bind(controller));
router.get('/allVideos', controller.getAllVideos.bind(controller));
router.get('/listing', controller.getVideoListing.bind(controller));
export const VideoRouter = router;
