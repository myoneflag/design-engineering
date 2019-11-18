// FlowAssignment[key] = [flow, beginEndpoint]
import {serializeValue} from '@/calculations/graph';

export class FlowAssignment extends Map<string, [number, string]> {
    getFlow(edgeUid: string, fromUid?: string): number {
        const res = this.get(edgeUid);
        if (!res) {
            return 0;
        }
        if (fromUid === undefined) {
            return Math.abs(res[0]);
        }
        if (res[1] === fromUid) {
            return res[0];
        } else {
            return -res[0];
        }
    }

    addFlow(edgeUid: string, fromUid: string, flow: number) {
        if (!this.has(edgeUid)) {
            this.set(edgeUid, [0, fromUid]);
        }
        const res = this.get(edgeUid)!;
        if (res[1] === fromUid) {
            res[0] += flow;
        } else {
            res[0] -= flow;
        }
    }

    toString() {
        let repr = '';
        this.forEach((v, k) => {
            repr += serializeValue(k) + ' ====> ' + serializeValue(v) + '\n\n';
        });
        return repr;
    }
}
