<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchProblems, fetchUserStates } from '../lib/problems'
import { user } from '../lib/session'

const section = ref('all')
const query = ref('')
const page = ref(1)
const pageSize = 20

const loading = ref(false)
const errorText = ref('')
const total = ref(0)
const rows = ref([])
const stateMap = ref(new Map())

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    const result = await fetchProblems({
      section: section.value,
      query: query.value,
      page: page.value,
      pageSize,
    })
    rows.value = result.rows
    total.value = result.total
    stateMap.value = await fetchUserStates(result.rows.map((r) => r.id))
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

function badgeFor(row) {
  const st = stateMap.value.get(row.id)
  if (!st) return null
  if (st.last_is_correct === true) return { text: '已掌握', kind: 'ok' }
  if (st.last_is_correct === false) return { text: '待巩固', kind: 'bad' }
  return null
}

function typeLabel(type) {
  if (type === 'single_choice') return '单选'
  if (type === 'multiple_choice') return '多选'
  if (type === 'fill_blank') return '填空'
  return type
}

watch([section, query], () => {
  page.value = 1
})

watch([section, query, page, user], () => load())

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="controls">
      <label class="control">
        <span class="label">题型</span>
        <select v-model="section" class="input">
          <option value="all">全部</option>
          <option value="单项选择题">单项选择题</option>
          <option value="多项选择题">多项选择题</option>
          <option value="填空题">填空题</option>
        </select>
      </label>

      <label class="control control--grow">
        <span class="label">搜索</span>
        <input v-model="query" class="input" placeholder="输入关键词（题干）" />
      </label>
    </div>

    <p v-if="errorText" class="alert">{{ errorText }}</p>
    <div v-if="loading" class="muted">加载中…</div>

    <div v-else class="list">
      <RouterLink v-for="row in rows" :key="row.id" class="item" :to="`/p/${row.id}`">
        <div class="item__top">
          <span class="meta">{{ row.section }} · #{{ row.source_no }} · {{ typeLabel(row.question_type) }}</span>
          <span v-if="stateMap.get(row.id)?.is_favorite" class="fav">收藏</span>
        </div>
        <div class="item__title">{{ row.stem }}</div>
        <div v-if="badgeFor(row)" class="badge" :class="`badge--${badgeFor(row).kind}`">
          {{ badgeFor(row).text }}
        </div>
      </RouterLink>
    </div>

    <div class="pager">
      <button class="btn" :disabled="page <= 1 || loading" @click="page--">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}（共 {{ total }} 题）</span>
      <button class="btn" :disabled="page >= totalPages || loading" @click="page++">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.control--grow {
  flex: 1;
  min-width: 220px;
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
  background: var(--card);
  color: var(--text);
}

.alert {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
}

.list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.item {
  display: block;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  text-decoration: none;
}

.item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.meta {
  color: var(--muted);
  font-size: 12px;
}

.fav {
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
}

.item__title {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  width: fit-content;
}

.badge--ok {
  border-color: color-mix(in oklab, var(--ok), #000 35%);
  background: color-mix(in oklab, var(--ok), var(--bg) 84%);
}

.badge--bad {
  border-color: color-mix(in oklab, var(--danger), #000 35%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}

.btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

