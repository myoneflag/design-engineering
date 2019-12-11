import Vue from 'vue';
import Router from 'vue-router';
import Login from './views/Login.vue';
import store from './store/store';
import axios from 'axios';
import LoadProfile from '../src/views/LoadProfile.vue';
import ChangePassword from '../src/views/ChangePassword.vue';
import ContactUs from './views/ContactUs.vue';
import {getSession} from "../src/api/logins";
import {AccessLevel, User as IUser} from "../../backend/src/entity/User";
import Organizations from "./views/Organizations.vue";
import Users from "./views/Users.vue";
import Organization from "./views/Organization.vue";
import CreateOrganization from "./views/CreateOrganization.vue";
import CreateUser from "./views/CreateUser.vue";
import User from "./views/User.vue";
import Contacts from "./views/Contacts.vue";
import Errors from "./views/Errors.vue";
import ViewError from './views/Error.vue';
Vue.use(Router);

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import(/* webpackChunkName: "home" */ './views/Home.vue'),
            meta: {
                auth: true,
            },
        },

        {
            path: '/document/:id',

            component: () => import(/* webpackChunkName: "about" */ './views/Document.vue'),

            children: [
                {
                    path: '',
                    name: 'drawing',

                    component: () => import(/* webpackChunkName: "about" */ './views/Canvas.vue'),
                },

                {
                    path: 'settings',
                    name: 'settings',

                    component: () => import(/* webpackChunkName: "settings" */ './views/settings/ProjectSettings.vue'),

                    children: [
                        {
                            path: 'general',
                            name: 'settings/general',
                            component: () => import(/* webpackChunkName: "general" */ './views/settings/General.vue'),
                        },
                        {
                            path: 'fixtures',
                            name: 'settings/fixtures',
                            component: () => import(
                                /* webpackChunkName: "general" */ './views/settings/Fixtures.vue'),
                        },
                        {
                            path: 'flow-systems',
                            name: 'settings/flow-systems',
                            component: () => import(
                                /* webpackChunkName: "general" */ './views/settings/FlowSystems.vue'),
                        },
                        {
                            path: 'calculations',
                            name: 'settings/calculations',
                            component: () => import(
                                /* webpackChunkName: "general" */ './views/settings/Calculations.vue'),
                        },
                        {
                            path: 'document',
                            name: 'settings/document',
                            component: () => import(
                                /* webpackChunkName: "general" */ './views/settings/Document.vue'),
                        },
                    ],

                    meta: {
                        auth: true,
                    },
                },
            ],

            meta: {
                auth: true,
            },
        },

        {
            path: '/organizations',
            name: 'organizations',
            component: Organizations,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN,
            },
        },

        {
            path: '/organizations/create',
            name: 'createOrganization',
            component: CreateOrganization,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN,
            },
        },

        {
            path: '/organizations/id/:id',
            name: 'organization',
            component: Organization,

            meta: {
                auth: true,
            },
        },

        {
            path: '/users',
            name: 'users',
            component: Users,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.MANAGER,
            },
        },
        {
            path: '/users/create',
            name: 'createUsers',
            component: CreateUser,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.ADMIN,
            },
        },
        {
            path: '/users/username/:id',
            name: 'user',
            component: User,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.USER,
            },
        },

        {
            path: '/contacts',
            name: 'contacts',
            component: Contacts,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER,
            },
        },

        {
            path: '/errors',
            name: 'errors',
            component: Errors,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER,
            },
        },

        {
            path: '/errors/id/:id',
            name: 'error',
            component: ViewError,

            meta: {
                auth: true,
                minAccessLevel: AccessLevel.SUPERUSER,
            },
        },

        {
            path: '/login',
            name: 'login',
            component: Login,
        },

        {
            path: '/login/complete',
            name: 'loginComplete',
            component: LoadProfile,
        },

        {
            path: '/changePassword',
            name: 'changePassword',
            component: ChangePassword,
        },

        {
            path: '/contact',
            name: 'contact',
            component: ContactUs,
        },
    ],
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.auth)) {
        if ((Vue as any).cookies.get('session-id') == null) {
            next('/login');
        } else {
            const levels = to.matched.filter((r) => 'minAccessLevel' in r.meta).map((r) => r.meta.minAccessLevel);
            const requiredAccess = Math.min(...levels);

            if (store.getters['profile/profile'] !== null) {
                if (requiredAccess !== undefined && store.getters['profile/profile'].accessLevel > requiredAccess) {
                    router.push('/login');
                } else {
                    next();
                }
            } else {
                getSession().then((res) => {
                    if (res.success === true) {
                        const result = res.data as IUser;
                        store.dispatch('profile/setProfile', result)
                            .then(() => {
                                if (requiredAccess !== undefined &&
                                    store.getters['profile/profile'].accessLevel > requiredAccess
                                ) {
                                    router.push('/login');
                                } else {
                                    router.push(to);
                                }
                            });
                    } else {
                        (Vue as any).cookies.remove('session-id');
                        next('/login');
                    }
                });

                // next('/loginComplete');
            }
        }
    } else {
        next();
    }
});

export default router;
