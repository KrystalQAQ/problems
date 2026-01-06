<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchWrong } from '../lib/localApi'
import { settings } from '../lib/settings'
import { setNavSession } from '../lib/navSession'

const loading = ref(false)
const errorText = ref('')
const rows = ref([])
const router = useRouter()

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    rows.value = await fetchWrong()
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function startAt(problemId) {
  const ids = rows.value.map((p) => p.id)
  setNavSession({ ids, label: '错题练习' })
  await router.push(`/p/${problemId}`)
}

function typeLabel(type) {
  if (type === 'single_choice') return '单选'
  if (type === 'multiple_choice') return '多选'
  if (type === 'fill_blank') return '填空'
  return type
}

onMounted(load)
watch(settings, () => load(), { deep: true })
</script>

<template>
  <div class="page">
    <p v-if="errorText" class="alert">{{ errorText }}</p>
    <div v-if="loading" class="muted">加载中…</div>

    <div v-else class="list">
      <div v-if="!rows.length" class="muted">暂无错题记录。</div>
      <button v-for="p in rows" :key="p.id" class="item item--btn" type="button" @click="startAt(p.id)">
        <div class="meta">{{ p.section }} · #{{ p.source_no }} · {{ typeLabel(p.question_type) }}</div>
        <div class="title">{{ p.stem }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.alert {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
}

.list {
  display: grid;
  gap: 10px;
}

.item {
  display: block;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  text-decoration: none;
}

.item--btn {
  text-align: left;
  cursor: pointer;
}

.item--btn:hover {
  border-color: color-mix(in oklab, var(--primary), #000 40%);
}

.meta {
  color: var(--muted);
  font-size: 12px;
}

.title {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
