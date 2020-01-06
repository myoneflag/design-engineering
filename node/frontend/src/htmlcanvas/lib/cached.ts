import BaseBackedObject from "./base-backed-object";
import stringify from "json-stable-stringify";

export default function Cached<T extends BaseBackedObject>(
    getDependencies: (kek: T) => Set<string>,
    serializeArgs?: (...args: any[]) => string
) {
    return (target: T, propertyKey: string, descriptor: PropertyDescriptor) => {/*
        const originalMethod = descriptor.value;
        descriptor.value = function(this: T) {
            const cacheKey =
                propertyKey + (serializeArgs ? serializeArgs(...arguments) : stringify(Array.from(arguments)));
            if (!this.cache.has(cacheKey)) {
                this.objectStore.watchDependencies(this.uid, cacheKey, getDependencies(this));
                this.cache.set(cacheKey, originalMethod.apply(this, arguments));
            }
            return this.cache.get(cacheKey);
        };*/
        return descriptor;
    };
}
