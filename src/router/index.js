import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/dashboard',
            meta:{requireAuth:true}
        },
        {
            path: '/',
            component: () => import(/* webpackChunkName: "home" */ '../components/common/Home.vue'),
            meta: { title: '自述文件' },
            children: [
                {
                    path: '/dashboard',
                    component: () => import(/* webpackChunkName: "dashboard" */ '../components/page/Dashboard.vue'),
                    meta: { title: '系统首页', requireAuth:true}
                },
                {
                    path: '/userManagement',
                    component: () => import(/* webpackChunkName: "userManagement" */ '../components/page/UserManagement.vue'),
                    meta: { title: '用户管理', requireAuth:true}
                },
                {
                    path: '/roleManagement',
                    component: () => import(/* webpackChunkName: "roleManagement" */ '../components/page/RoleManagement.vue'),
                    meta: { title: '角色管理', requireAuth:true}
                },
                {
                    path: '/permissionManagement',
                    component: () => import(/* webpackChunkName: "permissionManagement" */ '../components/page/PermissionManagement.vue'),
                    meta: { title: '权限管理', requireAuth:true}
                },
                {
                    // 权限页面
                    path: '/permission',
                    component: () => import(/* webpackChunkName: "permission" */ '../components/page/Permission.vue'),
                    meta: { title: '权限测试', permission: true }
                },
                {
                    path: '/404',
                    component: () => import(/* webpackChunkName: "404" */ '../components/page/404.vue'),
                    meta: { title: '404' }
                },
                {
                    path: '/403',
                    component: () => import(/* webpackChunkName: "403" */ '../components/page/403.vue'),
                    meta: { title: '403' }
                },
                {
                    path: '/donate',
                    component: () => import(/* webpackChunkName: "donate" */ '../components/page/Donate.vue'),
                    meta: { title: '支持作者' }
                }
            ]
        },
        {
            path: '/login',
            component: () => import(/* webpackChunkName: "login" */ '../components/page/Login.vue'),
            meta: { title: '登录' }
        },
        {
            path: '*',
            redirect: '/404'
        }
    ]
});
