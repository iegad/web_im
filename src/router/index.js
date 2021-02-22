import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/views/Main'
import Login from '@/views/Login'
import Live from '@/views/Live'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Main',
      component: Main
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/live',
      name: 'Live',
      component: Live
    }
  ]
})
