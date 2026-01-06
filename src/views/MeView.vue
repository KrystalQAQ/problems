<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchStats } from '../lib/localApi'
import { clearAllLocalData, getProblemsMeta } from '../lib/localStore'
import { hasSupabaseConfig } from '../lib/supabase'
import { user } from '../lib/session'
import { resetSettings, setTheme, settings } from '../lib/settings'
import { syncProblemsFromSupabase } from '../lib/sync'

const loading = ref(false)
const errorText = ref('')
const infoText = ref('')

const total = ref(0)
const correct = ref(0)
const wrongActive = ref(0)
const favorites = ref(0)

const problemsMeta = ref(getProblemsMeta())

const theme = computed({
  get: () => settings.value.theme,
  set: (v) => setTheme(v),
})

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    const s = await fetchStats()
    total.value = s.total
    correct.value = s.correct
    wrongActive.value = s.wrongActive
    favorites.value = s.favorites
    problemsMeta.value = getProblemsMeta()
  } catch (e) {
    errorText.value = e?.message ?? String(e)
    total.value = 0
    correct.value = 0
    wrongActive.value = 0
    favorites.value = 0
  } finally {
    loading.value = false
  }
}

async function onResetLocal() {
  clearAllLocalData()
  resetSettings()
  infoText.value = '已清空本地缓存（题库/收藏/错题/提交记录）。'
  errorText.value = ''
  problemsMeta.value = getProblemsMeta()
  await load()
}

async function onSyncProblems() {
  loading.value = true
  errorText.value = ''
  infoText.value = ''
  try {
    if (!hasSupabaseConfig()) {
      throw new Error('未配置 Supabase 环境变量：请设置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
    }
    const count = await syncProblemsFromSupabase()
    infoText.value = `题库已同步到本地（${count} 题）`
    problemsMeta.value = getProblemsMeta()
    await load()
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([user, settings], () => load(), { deep: true })
</script>

<template>
  <div class="page">
    <div class="card">
      <h1 class="h1">我的</h1>

      <div class="panel">
        <div class="row">
          <div>
            <div class="k">题库缓存</div>
            <div class="v">
              <span v-if="problemsMeta">已同步（{{ problemsMeta.count ?? '—' }} 题）</span>
              <span v-else>未同步（将使用内置题库/本地缓存）</span>
            </div>
            <div v-if="problemsMeta?.syncedAt" class="muted small">
              同步时间：{{ new Date(problemsMeta.syncedAt).toLocaleString() }}
            </div>
          </div>
          <button class="btn" type="button" @click="onSyncProblems">同步题库</button>
        </div>

        <div class="row">
          <div>
            <div class="k">主题</div>
            <div class="v">{{ theme === 'dark' ? '暗色' : '浅色' }}</div>
          </div>
          <select v-model="theme" class="select">
            <option value="light">浅色</option>
            <option value="dark">暗色</option>
          </select>
        </div>

        <div class="row">
          <div>
            <div class="k">账号</div>
            <div class="v">{{ user ? user.email : hasSupabaseConfig() ? '未登录' : '未配置 Supabase' }}</div>
          </div>
          <RouterLink v-if="!user" class="linkbtn" to="/login">去登录</RouterLink>
        </div>

        <div class="row">
          <div>
            <div class="k">本地数据</div>
            <div class="muted small">清空题库缓存、错题/收藏、提交记录</div>
          </div>
          <button class="btn btn--danger" type="button" @click="onResetLocal">重置</button>
        </div>
      </div>

      <p v-if="infoText" class="info">{{ infoText }}</p>
      <p v-if="errorText" class="alert">{{ errorText }}</p>

      <div v-if="loading" class="muted">加载中…</div>

      <div v-else class="stats">
        <div class="stat">
          <div class="k">总提交</div>
          <div class="v">{{ total }}</div>
        </div>
        <div class="stat stat--disabled">
          <div class="k">正确</div>
          <div class="v">{{ correct }}</div>
        </div>
        <RouterLink class="stat stat--link" to="/me/wrong">
          <div class="k">错题</div>
          <div class="v">{{ wrongActive }}</div>
        </RouterLink>
        <RouterLink class="stat stat--link" to="/me/favorites">
          <div class="k">收藏</div>
          <div class="v">{{ favorites }}</div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
}

.h1 {
  margin: 0 0 6px;
  font-size: 18px;
}

.muted {
  color: var(--muted);
}

.panel {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
}

.btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  cursor: pointer;
}

.btn--danger {
  border-color: color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--card) 86%);
}

.select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
}

.linkbtn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--text);
  background: var(--card);
}

.small {
  font-size: 12px;
  margin-top: 4px;
}

.stats {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  text-decoration: none;
}

.stat--link {
  cursor: pointer;
}

.stat--link:hover {
  border-color: color-mix(in oklab, var(--primary), #000 40%);
}

.stat--disabled {
  opacity: 0.85;
}

.k {
  color: var(--muted);
  font-size: 12px;
}

.v {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 750;
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
</style>
