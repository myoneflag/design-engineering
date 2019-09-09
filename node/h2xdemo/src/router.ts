import Vue from 'vue';
import Router from 'vue-router';
import Login from './views/Login.vue';
import store from './store/store';
import axios from 'axios';
import LoadProfile from '@/views/LoadProfile.vue';
import ChangePassword from '@/views/ChangePassword.vue';

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
            name: 'document',
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import(/* webpackChunkName: "about" */ './views/Document.vue'),
            meta: {
                auth: true,
            },
        },

        {
            path: '/document/settings',
            name: 'settings',
            children: [
                {
                    path: 'general',
                    name: 'general',
                    component: () => import(/* webpackChunkName: "general" */ './views/settings/General.vue'),
                },
                {
                    path: 'flow-systems',
                    name: 'flow-systems',
                    component: () => import(/* webpackChunkName: "general" */ './views/settings/FlowSystems.vue'),
                },
                {
                    path: 'calculations',
                    name: 'calculations',
                    component: () => import(/* webpackChunkName: "general" */ './views/settings/Calculations.vue'),
                },
                {
                    path: 'document',
                    name: 'document',
                    component: () => import(/* webpackChunkName: "general" */ './views/settings/Document.vue'),
                },
            ],

            component: () => import(/* webpackChunkName: "settings" */ './views/settings/ProjectSettings.vue'),
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
