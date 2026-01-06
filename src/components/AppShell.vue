<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { user, signOut } from '../lib/session'

const route = useRoute()
const router = useRouter()

const title = computed(() => {
  if (route.name === 'problem') return '题目'
  if (route.name === 'me') return '我的'
  if (route.name === 'login') return '登录'
  return '刷题'
})

async function onSignOut() {
  await signOut()
  if (route.meta.requiresAuth) await router.push({ name: 'home' })
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="topbar__left">
        <RouterLink class="brand" to="/">刷题</RouterLink>
        <span class="divider" />
        <span class="title">{{ title }}</span>
      </div>

      <div class="topbar__right">
        <RouterLink class="navlink" to="/">题库</RouterLink>
        <RouterLink class="navlink" to="/me">我的</RouterLink>
        <RouterLink v-if="!user" class="navlink navlink--primary" to="/login">登录</RouterLink>
        <button v-else class="navlink navlink--button" type="button" @click="onSignOut">退出</button>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--bg), #fff 4%);
  backdrop-filter: blur(6px);
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand {
  font-weight: 750;
  letter-spacing: 0.2px;
  color: var(--text);
  text-decoration: none;
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--border);
}

.title {
  color: var(--muted);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 30vw;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navlink {
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 10px;
}

.navlink.router-link-active {
  color: var(--text);
  background: color-mix(in oklab, var(--card), var(--bg) 20%);
}

.navlink--primary {
  color: var(--bg);
  background: var(--primary);
}

.navlink--button {
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
}

.main {
  max-width: 980px;
  margin: 0 auto;
  padding: 14px 14px 28px;
}

@media (max-width: 560px) {
  .topbar__right {
    gap: 6px;
  }
  .navlink {
    padding: 8px 8px;
  }
}
</style>

