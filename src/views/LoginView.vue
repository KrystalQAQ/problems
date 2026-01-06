<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithPassword, signUp } from '../lib/session'
import { syncProblemsFromSupabase } from '../lib/sync'
import { hasSupabaseConfig } from '../lib/supabase'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorText = ref('')
const infoText = ref('')

async function onLogin() {
  loading.value = true
  errorText.value = ''
  infoText.value = ''
  try {
    if (!hasSupabaseConfig()) {
      throw new Error('未配置 Supabase 环境变量：请设置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
    }
    await signInWithPassword({ email: email.value.trim(), password: password.value })
    infoText.value = '登录成功，正在同步题库到本地缓存…'
    try {
      const count = await syncProblemsFromSupabase()
      infoText.value = `题库已同步到本地（${count} 题）`
    } catch (e) {
      infoText.value = `题库同步失败（将继续使用本地缓存/内置题库）：${e?.message ?? String(e)}`
    }
    await router.push(route.query.redirect?.toString() || '/')
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function onSignup() {
  loading.value = true
  errorText.value = ''
  infoText.value = ''
  try {
    if (!hasSupabaseConfig()) {
      throw new Error('未配置 Supabase 环境变量：请设置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
    }
    await signUp({ email: email.value.trim(), password: password.value })
    infoText.value = '注册成功：如果开启了邮箱确认，请先去邮箱完成验证后再登录。'
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h1 class="h1">登录 / 注册</h1>
      <p class="muted">使用 Supabase Auth（邮箱 + 密码）。</p>

      <div class="grid">
        <label class="field">
          <span class="label">邮箱</span>
          <input v-model="email" class="input" type="email" placeholder="you@example.com" autocomplete="email" />
        </label>

        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="password"
            class="input"
            type="password"
            placeholder="至少 6 位"
            autocomplete="current-password"
          />
        </label>
      </div>

      <p v-if="errorText" class="alert">{{ errorText }}</p>
      <p v-if="infoText" class="info">{{ infoText }}</p>

      <div class="actions">
        <button class="btn btn--primary" :disabled="loading" @click="onLogin">登录</button>
        <button class="btn" :disabled="loading" @click="onSignup">注册</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 520px;
  margin: 18px auto 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
}

.h1 {
  margin: 0 0 6px;
  font-size: 18px;
}

.grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  color: var(--muted);
  font-size: 12px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
}

.btn--primary {
  border-color: transparent;
  background: var(--primary);
  color: var(--bg);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
}

.info {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--ok), #000 40%);
  background: color-mix(in oklab, var(--ok), var(--bg) 86%);
}

.muted {
  color: var(--muted);
}
</style>
