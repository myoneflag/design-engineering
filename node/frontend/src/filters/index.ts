import { VueConstructor } from "vue/types/umd";

export default {
    install(Vue: VueConstructor) {
        Vue.filter("truncate", function truncate(item: string, length:number = 16) {
            if (!item) return item;
            let descLength = item.length;
            if (descLength > length) {
                return item.slice(0, length) + "...";
            }
            return item;
        });
    }
};
