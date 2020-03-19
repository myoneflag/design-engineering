// record visible objects only.
import BaseBackedObject from "./base-backed-object";
import Vue from "vue";
import { DocumentState } from "../../store/document/types";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import BackedConnectable, { BaseBackedConnectable } from "./BackedConnectable";
import { ConnectableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";

export class ObjectStore extends Map<string, BaseBackedObject> {
    dependsOn = new Map<string, Map<string, Set<string>>>();
    dependedBy = new Map<string, Map<string, Set<string>>>();
    protected connections = new Map<string, string[]>();
    protected oldEndpoints = new Map<string, [string, string]>();
    protected graveyard = new Map<string, BaseBackedObject>();
    protected preserveList = new Set<string>();

    constructor() {
        super();
    }

    clear() {
        super.clear();
        this.dependsOn.clear();
        this.dependedBy.clear();
        this.connections.clear();
        this.oldEndpoints.clear();
        this.graveyard.clear();
        this.preserveList.clear();
    }

    getConnections(uid: string): string[] {
        return this.connections.get(uid) || [];
    }

    get(key: string) {
        const res = super.get(key);
        if (res) {
            return res;
        }
        return this.graveyard.get(key);
    }

    watchDependencies(uid: string, prop: string, deps: Set<string>) {
        if (!this.dependsOn.has(uid)) {
            this.dependsOn.set(uid, new Map<string, Set<string>>());
        }
        const depends = this.dependsOn.get(uid)!;
        if (!depends.has(prop)) {
            depends.set(prop, deps);
        } else {
            throw new Error("Property " + uid + " " + prop + " already has deps registered.");
        }

        deps.forEach((dep) => {
            if (!this.dependedBy.has(dep)) {
                this.dependedBy.set(dep, new Map<string, Set<string>>());
            }
            const depended = this.dependedBy.get(dep)!;
            if (!depended.has(uid)) {
                depended.set(uid, new Set<string>());
            }
            if (!depended.get(uid)!.has(prop)) {
                depended.get(uid)!.add(prop);
            } else {
                throw new Error("Dependency " + dep + " already has prop " + uid + " " + prop + " registered.");
            }
        });
    }

    bustDependencies(uid: string) {
        if (this.dependedBy.has(uid)) {
            this.dependedBy.get(uid)!.forEach((props, target) => {
                if (this.has(target)) {
                    const o = this.get(target)!;
                    props.forEach((prop) => {
                        o.cache.delete(prop);
                    });
                }

                const tprops = this.dependsOn.get(target)!;
                Array.from(props).forEach((prop) => {
                    const deps = tprops.get(prop)!;
                    deps.forEach((dep) => {
                        this.dependedBy
                            .get(dep)!
                            .get(target)!
                            .delete(prop);
                        if (!this.dependedBy.get(dep)!.get(target)!.size) {
                            this.dependedBy.get(dep)!.delete(target);
                        }
                        if (!this.dependedBy.get(dep)!.size) {
                            this.dependedBy.delete(dep);
                        }
                    });

                    if (!this.dependsOn.get(target)!.delete(prop)) {
                        throw new Error("dependency graph inconsistency");
                    }
                    if (this.dependsOn.get(target)!.size === 0) {
                        this.dependsOn.delete(target);
                    }
                });
            });
        }
    }

    onEntityChange(uid: string) {
        this.bustDependencies(uid);
        const o = this.get(uid)!;
        o.onUpdate();
        if (o.type === EntityType.PIPE) {
            this.updatePipeEndpoints(uid);
        }
    }

    preserve(uids: string[]) {
        this.preserveList = new Set<string>(uids);
        this.graveyard.forEach((o, k) => {
            if (!this.preserveList.has(k)) {
                this.graveyard.delete(k);
            }
        });
    }

    delete(key: string) {
        this.bustDependencies(key);
        const val = this.get(key);

        if (this.oldEndpoints.has(key)) {
            this.detatchOldEndpoints(key);
        }

        if (this.preserveList.has(key) && val) {
            this.graveyard.set(key, val);
        }

        return super.delete(key);
    }

    set(key: string, value: BaseBackedObject) {
        this.bustDependencies(key);
        if (this.graveyard.has(key)) {
            value = this.graveyard.get(key)!;
        }

        // __calc__ is an indicator for a calculatable network entity, which is transient and doesn't
        // need to be reactive.
        if (!(value.entity as any).__ob__ && !(value.entity as any).__calc__) {
            throw new Error("Not reactive");
        }
        if (this.has(key)) {
            const val = this.get(key);
            if (val && val.entity.type === EntityType.PIPE) {
                this.detatchOldEndpoints(key);
            }
        }

        if (value.entity.type === EntityType.PIPE) {
            this.attachEndpoints(value.entity);
        }

        const result = super.set(key, value);
        return result;
    }

    // undefined values only for deleting values. So hacky but we need to hack now.
    updatePipeEndpoints(key: string) {
        this.bustDependencies(key);
        const e = this.get(key)!.entity as PipeEntity;
        this.detatchOldEndpoints(key);
        this.attachEndpoints(e);
    }

    private detatchOldEndpoints(uid: string) {
        this.oldEndpoints.get(uid)!.forEach((oldVal) => {
            if (oldVal === undefined) {
                return;
            }
            this.bustDependencies(oldVal);
            const arr = this.connections.get(oldVal);
            if (!arr) {
                throw new Error("old value didn't register a connectable. " + oldVal);
            }
            const ix = arr.indexOf(uid);
            if (ix === -1) {
                throw new Error("connections are in an invalid state");
            }


            const co = this.get(oldVal) as BaseBackedConnectable;
            if (co) {
                co.disconnect(uid);
            }

            arr.splice(ix, 1);
        });
        this.oldEndpoints.delete(uid);
    }

    private attachEndpoints(entity: PipeEntity) {
        entity.endpointUid.forEach((newVal) => {
            if (newVal === undefined) {
                return;
            }
            this.bustDependencies(newVal);
            if (!this.connections.has(newVal)) {
                this.connections.set(newVal, []);
            }
            if (this.get(newVal)) {
                (this.get(newVal) as BackedConnectable<ConnectableEntityConcrete>).connect(entity.uid);
            }
            this.connections.get(newVal)!.push(entity.uid);
        });
        this.oldEndpoints.set(entity.uid, [entity.endpointUid[0], entity.endpointUid[1]]);
    }
}
