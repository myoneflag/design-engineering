import axios from "axios";
import { getFloorPlanRenders, getImageLink } from "../../api/pdf";

// Retrying image loading in an exponential backoff manner
// Total max delay: ~30 sec
// Calculation: https://www.wolframalpha.com/input/?i=sum+1.2%5En%2C+n%3D1+to+10
const MAX_ITERATIONS = 10
const EXP_BACKOFF_FACTOR = 1.2
const MILLISECONDS = 1000

export default class ImageLoader {
    static images = new Map<string, Promise<HTMLImageElement>>();

    static async get(key: string): Promise<HTMLImageElement> {
        if (!this.images.has(key)) {    
            const result = new Promise<HTMLImageElement>(async (resolve, reject) => {
                // get system render first

                const imageLinks = await getImageLink(key);
                if (!imageLinks.success) {
                    reject("couldn't get secure link");
                    return;
                }

                let iters = 0;
                while (iters < MAX_ITERATIONS) {
                    try {
                        await axios.head(imageLinks.data.head);
                        const image = new Image();

                        // to allow exporting once it's drawn into the canvas.
                        image.crossOrigin = "Anonymous";

                        image.onload = () => {
                            resolve(image);
                        };

                        image.src = imageLinks.data.get;

                        break;
                    } catch (e) {
                        console.debug(e)
                        await new Promise((r, e) => setTimeout(r, Math.pow(EXP_BACKOFF_FACTOR, iters) * MILLISECONDS));
                    }
                    iters++;
                }

                if (iters === MAX_ITERATIONS) {
                    reject("Could not load image background")
                    return;
                }

            });

            this.images.set(key, result);
        }

        return this.images.get(key)!;
    }
}
