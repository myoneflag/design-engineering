import Layer from '@/components/canvas/layer';
import {DocumentState} from '@/store/document/types';
import {ViewPort} from '@/Drawings/2DViewport';
import {BackgroundImage} from '@/Drawings/BackgroundImage';
import axios from 'axios';

export default class BackgroundLayer implements Layer {
    uriToObject: { [uri: string]: BackgroundImage | string } = {};

    onLoad: (uri: string) => any;

    constructor(onLoad: (uri: string) => any) {
        this.onLoad = onLoad;
    }

    draw(ctx: CanvasRenderingContext2D, vp: ViewPort) {
        for (let uri in this.uriToObject) {
            let bgi = this.uriToObject[uri];
            if (bgi instanceof BackgroundImage) {
                bgi.draw(ctx, vp, true);
            }
        }
    }

    update(doc: DocumentState) {
        for (const background of doc.drawing.backgrounds) {
            if ( this.uriToObject[background.uri] === undefined) {
                if (this.uriToObject[background.uri] === 'handled') {
                    //
                } else {
                    this.uriToObject[background.uri] = 'handled';

                    const retry = () => {
                        axios.head(background.uri).then((res) => {
                                console.log('background loaded. Resp: ' + res.status);
                                this.uriToObject[background.uri] = new BackgroundImage(
                                    background.uri,
                                    Object.assign({}, background.center),
                                    {
                                        w: background.scale * background.paperSize.width,
                                        h: background.scale * background.paperSize.height,
                                    },
                                    (image: BackgroundImage) => {
                                        this.onLoad(background.uri);
                                    },
                                );
                            },
                        ).catch((err) => {
                            console.log('Resource not loaded. ' + err);
                            setTimeout(() => {
                                console.log("retrying...");
                                retry();
                            }, 1000);
                        });
                    };

                    retry();
                }
            }
        }
    }
}
