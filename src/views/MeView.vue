<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user } from '../lib/session'

const loading = ref(false)
const errorText = ref('')

const correct = ref(0)
const total = ref(0)
const favorites = ref(0)
const wrongActive = ref(0)

async function load() {
  if (!user.value) return
  loading.value = true
  errorText.value = ''
  try {
    const { count: totalCount, error: totalErr } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
    if (totalErr) throw totalErr
    total.value = totalCount ?? 0

    const { count: correctCount, error: correctErr } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('is_correct', true)
    if (correctErr) throw correctErr
    correct.value = correctCount ?? 0

    const { count: wrongActiveCount, error: wrongActiveErr } = await supabase
      .from('user_problem_state')
      .select('problem_id', { count: 'exact', head: true })
      .eq('last_is_correct', false)
    if (wrongActiveErr) throw wrongActiveErr
    wrongActive.value = wrongActiveCount ?? 0

    const { count: favCount, error: favErr } = await supabase
      .from('user_problem_state')
      .select('problem_id', { count: 'exact', head: true })
      .eq('is_favorite', true)
    if (favErr) throw favErr
    favorites.value = favCount ?? 0
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(user, () => load())
</script>

<template>
  <div class="page">
    <div class="card">
      <h1 class="h1">我的</h1>
      <p class="muted" v-if="user">当前账号：{{ user.email }}</p>
      <p v-else class="muted">请先登录。</p>

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
</style>
