import Vue from 'vue';
import App from './App.vue';
import router from './router';
import ElementUI from 'element-ui';
import VueI18n from 'vue-i18n';
import { messages } from './components/common/i18n';
import 'element-ui/lib/theme-chalk/index.css'; // 默认主题
// import './assets/css/theme-green/index.css'; // 浅绿色主题
import './assets/css/icon.css';
import './components/common/directives';
import 'babel-polyfill';
import axios from 'axios'
import VueAxios from 'vue-axios'

Vue.use(VueAxios, axios);

Vue.config.productionTip = false;
Vue.use(VueI18n);
Vue.use(ElementUI, {
    size: 'small'
});
const i18n = new VueI18n({
    locale: 'zh',
    messages
});

//使用钩子函数对路由进行权限跳转
// router.beforeEach((to, from, next) => {
//     document.title = `${to.meta.title} | vue-manage-system`;
//     const role = localStorage.getItem('ms_username');
//     if (!role && to.path !== '/login') {
//         next('/login');
//     } else if (to.meta.permission) {
//         // 如果是管理员权限则可进入，这里只是简单的模拟管理员权限而已
//         role === 'admin' ? next() : next('/403');
//     } else {
//         // 简单的判断IE10及以下不进入富文本编辑器，该组件不兼容
//         if (navigator.userAgent.indexOf('MSIE') > -1 && to.path === '/editor') {
//             Vue.prototype.$alert('vue-quill-editor组件不兼容IE10及以下浏览器，请使用更高版本的浏览器查看', '浏览器不兼容通知', {
//                 confirmButtonText: '确定'
//             });
//         } else {
//             next();
//         }
//     }
// });
router.beforeEach((to, from, next) => {
    console.log(to);
    console.log(from);
    if (to.meta.requireAuth) { // 判断该路由是否需要登录权限
        if(localStorage.getItem("Authorization")){ //判断本地是否存在access_token
            next();
        }else {
            if(to.path === '/login'){
                next();
            }else {
                next({
                    path:'/login',
                    query: {redirect: to.fullPath}  // 将跳转的路由path作为参数，登录成功后跳转到该路由
                })
            }
        }
    }
    else {
        next();
    }
    /*如果本地 存在 token 则 不允许直接跳转到 登录页面*/
    if(to.fullPath === "/login"){
        if(localStorage.getItem("Authorization")){
            next({
                path:from.fullPath
            });
        }else {
            next();
        }
    }
});


// 请求拦截
axios.interceptors.request.use(config => {
    // 判断是否存在token，如果存在的话，则每个http header都加上token
    if (localStorage.getItem("Authorization")) {//条件这么写是因为在login.vue的页面把token存入了localStorage的wxToken中
        // console.log(localStorage.Authorization);
        config.headers.Authorization = localStorage.getItem("Authorization") ;
    }
    return config;//赋值完后把config返回回去

}, error => {
    // 请求错误后把我们的error返回回去
    return Promise.reject(error);
})

/**
 * 响应拦截
 * ,优式在于;在页面中每次请求的时候不需要写一遍catch
 *  */

axios.interceptors.response.use(
    response => {
        //请求成功就给它返回回去
        return response;
    },
    // 请求错误
    error => {
        //错误提醒
        // 如果token过期了的话;我们也需要给一个提醒
        const { status } = error.response;//在response中有一个status 我们用es6的方式解构出来
        if (status === 401) {
            //后台定义401为token过期
            console.error('token过期,请重新登录!');
            //  如果token过期了;我们应该清楚token
            localStorage.removeItem('localStorage.Authorization');
            //   清楚后让它跳转到登录页面去
            router.replace({
                path: '/login',
                query: {redirect: router.currentRoute.fullPath}
            });
        } else {
            console.error(error.response.data)
        }
        return Promise.reject(error);
    }
);

new Vue({
    router,
    i18n,
    render: h => h(App)
}).$mount('#app');
