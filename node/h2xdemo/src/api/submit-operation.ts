import * as OT from '@/store/document/operation-transforms/operation-transforms';
import axios from 'axios';

const queue: OT.OperationTransform[] = [];

function submitLoop() {
    return axios.post('/api/document/operation', queue[0]).catch(() => {
        window.alert('Please refresh your browser, an error has been detected trying to communicate with the server.');
    }).then(() => {
        queue.splice(0, 1);
        if (queue.length) {
            submitLoop();
        }
    });
}

export function submitOperation(commit: any, ops: OT.OperationTransform[]) {
    // yay it's javascript! There's no atomic concurrency issues!

    if (queue.length === 0) {
        queue.push(...ops);
        // it means it was empty at the start, so the submit loop must be started again.
        // This only works if (queue===[]) ==> submitLoop() not running
        // and submitLoop() not running ==> (queue===[])
        submitLoop();
    } else {
        queue.push(...ops);
    }
}
