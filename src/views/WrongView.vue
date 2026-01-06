<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '../lib/supabase'

const loading = ref(false)
const errorText = ref('')
const rows = ref([])

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    const { data, error } = await supabase
      .from('user_problem_state')
      .select('problem_id, last_is_correct, problems:problem_id(id, section, source_no, question_type, stem)')
      .eq('last_is_correct', false)
      .order('last_answered_at', { ascending: false })

    if (error) throw error

    rows.value = (data ?? [])
      .map((r) => r.problems)
      .filter(Boolean)
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

function typeLabel(type) {
  if (type === 'single_choice') return '单选'
  if (type === 'multiple_choice') return '多选'
  if (type === 'fill_blank') return '填空'
  return type
}

onMounted(load)
</script>

<template>
  <div class="page">
    <p v-if="errorText" class="alert">{{ errorText }}</p>
    <div v-if="loading" class="muted">加载中…</div>

    <div v-else class="list">
      <div v-if="!rows.length" class="muted">暂无错题记录。</div>
      <RouterLink v-for="p in rows" :key="p.id" class="item" :to="`/p/${p.id}`">
        <div class="meta">{{ p.section }} · #{{ p.source_no }} · {{ typeLabel(p.question_type) }}</div>
        <div class="title">{{ p.stem }}</div>
      </RouterLink>
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

