import Vue from 'vue';
import Router from 'vue-router';
import Login from './views/Login.vue';
import store from './store/store';
import axios from 'axios';
import LoadProfile from '@/views/LoadProfile.vue';
import ChangePassword from '@/views/ChangePassword.vue';
import Contact from '@/views/Contact.vue';

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
            path: '/document',

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
            component: Contact,
        }
    ],
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.auth)) {
        if ((Vue as any).cookies.get('session-id') == null) {
            next({
                name: 'login',
            });
        } else {
            if (store.getters['profile/username'] !== '') {
                next();
            } else {
                axios.post('/api/session')
                .then(({data: {success, username}}) => {
                    if (success === true) {
                        store.dispatch('profile/setUsername', username)
                            .then(() => {
                                    router.push(to);
                                });
                    } else {
                        (Vue as any).cookies.remove('session-id');
                        next({
                            name: 'login',
                        });
                    }
                });

                next({
                    name: 'loginComplete',
                });
            }
        }
    } else {
        next();
    }
});

export default router;
