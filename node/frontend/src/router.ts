import Vue from "vue";
import Router from "vue-router";
import Login from "./views/Login.vue";
import store from "./store/store";
import axios from "axios";
import LoadProfile from "../src/views/LoadProfile.vue";
import ChangePassword from "../src/views/ChangePassword.vue";
import ContactUs from "./views/ContactUs.vue";
import ChangeLogs from "./views/ChangeLogs.vue"
import { getSession } from "../src/api/logins";
import { AccessLevel, User as IUser } from "../../common/src/models/User";
import Organizations from "./views/Organizations.vue";
import Users from "./views/Users.vue";
import Organization from "./views/Organization.vue";
import CreateOrganization from "./views/CreateOrganization.vue";
import CreateUser from "./views/CreateUser.vue";
import User from "./views/User.vue";
import Contacts from "./views/Contacts.vue";
import Errors from "./views/Errors.vue";
import ViewError from "./views/Error.vue";
import ProfileState from "./store/profile/types";
Vue.use(Router);

const router = new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: "/",
            name: "home",
            component: () => import(/* webpackChunkName: "home" */ "./views/Home.vue"),
            meta: {
                auth: true
            }
        },

        {
            path: "/document/:id",

            component: () => import(/* webpackChunkName: "document" */ "./views/Document.vue"),

            children: [
                {
                    path: "",
                    name: "drawing",

                    component: () => import(/* webpackChunkName: "drawing" */ "./views/Canvas.vue")
                },

                {
                    path: "settings",
                    name: "settings",

                    component: () => import(/* webpackChunkName: "settings" */ "./views/settings/ProjectSettings.vue"),

                    children: [
                        {
                            path: "catalog/:prop?",
                            name: "settings/catalog",
                            component: () => import(/* webpackChunkName: "catalog" */ "./views/catalog/CatalogView.vue")
                        },

                        {
                            path: "general",
                            name: "settings/general",
                            component: () => import(/* webpackChunkName: "general" */ "./views/settings/General.vue")
                        },
                        {
                            path: "fixtures",
                            name: "settings/fixtures",
                            component: () => import(/* webpackChunkName: "fixtures" */ "./views/settings/Fixtures.vue")
                        },
                        {
                            path: "flow-systems",
                            name: "settings/flow-systems",
                            component: () =>
                                import(/* webpackChunkName: "flow-systems" */ "./views/settings/FlowSystems.vue")
                        },
                        {
                            path: "calculations",
                            name: "settings/calculations",
                            component: () =>
                                import(/* webpackChunkName: "calculations" */ "./views/settings/Calculations.vue")
                        },
                        {
                            path: "document",
                            name: "settings/document",
                            component: () => import(/* webpackChunkName: "document" */ "./views/settings/Document.vue")
                        },
                        {
                            path: "debug",
                            name: "settings/debug",
                            component: () => import(/* webpackChunkName: "debug" */ "./views/settings/Debug.vue")
                        }
                    ],

                    meta: {
                        auth: true
                    }
                },

                {
                    path: "calculation-overview",
                    name: "calculation-overview",
                    component: () => import(/* webpackChunkName: "calc-overview" */ "./views/CalculationOverview.vue")
                }
            ],

            meta: {
                auth: true
            }
        },

        {
            path: "/organizations",
            name: "organizations",
            component: Organizations,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN
            }
        },

        {
            path: "/organizations/create",
            name: "createOrganization",
            component: CreateOrganization,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN
            }
        },

        {
            path: "/organizations/id/:id",
            name: "organization",
            component: Organization,

            meta: {
                auth: true
            }
        },

        {
            path: "/users",
            name: "users",
            component: Users,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.MANAGER
            }
        },
        {
            path: "/users/create",
            name: "createUsers",
            component: CreateUser,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN
            }
        },
        {
            path: "/users/username/:id",
            name: "user",
            component: User,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.USER
            }
        },

        {
            path: "/contacts",
            name: "contacts",
            component: Contacts,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER
            }
        },

        {
            path: "/errors",
            name: "errors",
            component: Errors,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER
            }
        },

        {
            path: "/errors/id/:id",
            name: "error",
            component: ViewError,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER
            }
        },

        {
            path: "/login",
            name: "login",
            component: Login
        },

        {
            path: "/login/complete",
            name: "loginComplete",
            component: LoadProfile
        },

        {
            path: "/changePassword",
            name: "changePassword",
            component: ChangePassword,
            meta: {
                auth: true,
                needsEula: false
            }
        },

        {
            path: "/contact",
            name: "contact",
            component: ContactUs
        },
        {
            path: "/eula",
            name: "eula",
            component: () => import(/* webpackChunkName: "eula" */ "./views/Eula.vue"),
            meta: {
                auth: true,
                needsEula: false
            }
        },
        {
            path: "/changeLogs",
            name: "changeLogs",
            component: ChangeLogs
        },
    ]
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.auth)) {
        if (Vue.$cookies === undefined || Vue.$cookies.get("session-id") == null) {
            next("/login");
        } else {
            const levels = to.matched.filter((r) => "minAccessLevel" in r.meta).map((r) => r.meta.minAccessLevel);
            const requiredAccess = Math.min(...levels);

            if (store.getters["profile/profile"] === null) {
                getSession().then((res) => {
                    if (res.success === true) {
                        const result = res.data as IUser;
                        store.dispatch("profile/setProfile", result).then(() => {
                            if (
                                requiredAccess !== undefined &&
                                store.getters["profile/profile"].accessLevel > requiredAccess
                            ) {
                                router.push("/login");
                            } else {
                                next();
                            }
                        });
                    } else {
                        Vue.$cookies.remove("session-id");
                        next("/login");
                    }
                });
            } else {
                const needsEula =
                    to.matched.filter(
                        (r) => r.meta && r.meta.auth && (r.meta.needsEula === undefined || r.meta.needsEula)
                    ).length > 0;

                if (needsEula && !(store.getters["profile/profile"] as IUser).eulaAccepted) {
                    router.push({ name: "eula" });
                } else if (
                    requiredAccess !== undefined &&
                    store.getters["profile/profile"].accessLevel > requiredAccess
                ) {
                    router.push("/login");
                } else {
                    next();
                }
            }
        }
    } else {
        next();
    }
});

export default router;
