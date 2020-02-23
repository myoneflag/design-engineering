import axios from "axios";
import { getFloorPlanRenders, getImageLink } from "../../api/pdf";

export default class ImageLoader {
    static images = new Map<string, Promise<HTMLImageElement>>();

    static async get(key: string): Promise<HTMLImageElement> {
        if (!this.images.has(key)) {

            const result = new Promise<HTMLImageElement>(async (resolve, reject) => {

                // get system render first

                const imageLinks = await getImageLink(key);
                if (imageLinks.success) {
                    //
                } else {
                    reject("couldn't get secure link");
                    return;
                }

                let iters = 0;
                while (true) {
                    try {
                        await axios.head(imageLinks.data.head);
                        const image = new Image();

                        // to allow exporting once it's drawn into the canvas.
                        image.crossOrigin = 'Anonymous';


                        image.onload = () => {
                            resolve(image);
                        };

                        image.src = imageLinks.data.get;

                        break;
                    } catch (e) {
                        await new Promise((r, e) => setTimeout(r, Math.pow(1.1, iters) * 1000));
                    }
                    iters++;
                }

            });

            this.images.set(key, result);
        }

        return this.images.get(key)!;
    }
}
