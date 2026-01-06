import { createRouter, createWebHistory } from 'vue-router'
import { getUser } from '../lib/session'

const ProblemListView = () => import('../views/ProblemListView.vue')
const ProblemDetailView = () => import('../views/ProblemDetailView.vue')
const LoginView = () => import('../views/LoginView.vue')
const MeView = () => import('../views/MeView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: ProblemListView },
    { path: '/p/:id', name: 'problem', component: ProblemDetailView, props: true },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/me', name: 'me', component: MeView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', name: '404', component: NotFoundView },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const user = await getUser()
  if (user) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})

export default router

