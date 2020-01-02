import * as _ from "lodash";

export class GroupDistCache {
    // Parallel array, 2-way mapping. Remember to maintain that.
    cache = new Map<string, Map<string, number | null>>();

    addGroup(gid: string, dists: Map<string, number | null>) {
        dists.forEach((v, k) => {
            if (v !== null && isNaN(v)) {
                throw new Error("NaN found while adding group, key: " + k + " group: " + gid);
            }
            this.getOrSet(gid).set(k, v);
            this.getOrSet(k).set(gid, v);
        });
    }

    join(auid: string, buid: string, nuid: string) {
        if (nuid !== auid && nuid !== buid) {
            throw new Error("new uid must be one of the old ones when simulating a union join");
        }
        const newMap = _.clone(this.getOrSet(auid));
        this.getOrSet(buid).forEach((v, k) => {
            if (newMap.has(k)) {
                const curr = newMap.get(k);
                if (curr === undefined) {
                    throw new Error("just for type checking");
                }

                if (curr === null) {
                    newMap.set(k, v);
                } else if (v === null) {
                    newMap.set(k, curr);
                } else {
                    newMap.set(k, Math.min(curr, v));
                }
            } else {
                newMap.set(k, v);
            }
        });
        newMap.delete(auid);
        newMap.delete(buid);
        this.delete(auid);
        this.delete(buid);
        this.addGroup(nuid, newMap);
    }

    get(auid: string, buid: string) {
        const v1 = this.cache.get(auid)!.get(buid);
        const v2 = this.cache.get(buid)!.get(auid);
        if (v1 !== v2) {
            throw new Error("cache is inconsistent " + auid + " " + buid + " " + v1 + " " + v2);
        }
        return v1!;
    }

    private getOrSet(key: string) {
        if (!this.cache.has(key)) {
            this.cache.set(key, new Map<string, number | null>());
        }
        return this.cache.get(key)!;
    }

    private delete(key: string) {
        this.getOrSet(key).forEach((v, k) => {
            this.cache.get(k)!.delete(key);
        });
        this.cache.delete(key);
    }
}
