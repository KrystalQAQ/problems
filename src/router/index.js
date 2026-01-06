import { createRouter, createWebHashHistory } from 'vue-router'

const ProblemListView = () => import('../views/ProblemListView.vue')
const ProblemDetailView = () => import('../views/ProblemDetailView.vue')
const LoginView = () => import('../views/LoginView.vue')
const MeView = () => import('../views/MeView.vue')
const FavoritesView = () => import('../views/FavoritesView.vue')
const WrongView = () => import('../views/WrongView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: ProblemListView },
    { path: '/p/:id', name: 'problem', component: ProblemDetailView, props: true },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/me', name: 'me', component: MeView },
    { path: '/me/favorites', name: 'favorites', component: FavoritesView },
    { path: '/me/wrong', name: 'wrong', component: WrongView },
    { path: '/:pathMatch(.*)*', name: '404', component: NotFoundView },
  ],
})

export default router
