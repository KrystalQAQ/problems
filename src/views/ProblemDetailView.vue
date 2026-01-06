<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchProblem, fetchUserStates, submitAnswer, toggleFavorite } from '../lib/problems'
import { user } from '../lib/session'

const route = useRoute()
const id = computed(() => route.params.id)

const loading = ref(false)
const errorText = ref('')
const problem = ref(null)

const picked = ref([])
const reveal = ref(false)
const submitResult = ref(null)

const state = ref(null)
const busyFavorite = ref(false)

const optionsList = computed(() => {
  const opts = problem.value?.options
  if (!opts) return []
  return Object.entries(opts).map(([k, v]) => ({ key: k, text: v }))
})

const correctChoices = computed(() => problem.value?.answer?.choices ?? [])
const isMulti = computed(() => problem.value?.question_type === 'multiple_choice')

function togglePick(k) {
  if (isMulti.value) {
    picked.value = picked.value.includes(k) ? picked.value.filter((x) => x !== k) : [...picked.value, k]
  } else {
    picked.value = [k]
  }
}

function normalizeChoices(arr) {
  return [...new Set(arr)].sort()
}

const isCorrect = computed(() => {
  if (!problem.value) return false
  if (problem.value.question_type === 'fill_blank') return false
  return (
    normalizeChoices(picked.value).join(',') === normalizeChoices(correctChoices.value).join(',')
  )
})

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    problem.value = await fetchProblem(id.value)
    const m = await fetchUserStates([problem.value.id])
    state.value = m.get(problem.value.id) ?? null
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!problem.value) return
  reveal.value = true

  if (problem.value.question_type === 'fill_blank') {
    submitResult.value = { ok: null, text: '填空题暂不支持自动判题（已展示参考答案）' }
    return
  }

  if (!picked.value.length) {
    submitResult.value = { ok: false, text: '请选择一个选项再提交' }
    return
  }

  try {
    await submitAnswer({
      problemId: problem.value.id,
      answer: { choices: normalizeChoices(picked.value) },
      isCorrect: isCorrect.value,
    })
    submitResult.value = { ok: isCorrect.value, text: isCorrect.value ? '回答正确' : '回答错误' }
    const m = await fetchUserStates([problem.value.id])
    state.value = m.get(problem.value.id) ?? null
  } catch (e) {
    submitResult.value = { ok: null, text: e?.message ?? String(e) }
  }
}

async function onToggleFavorite() {
  if (!problem.value) return
  busyFavorite.value = true
  try {
    const next = !(state.value?.is_favorite ?? false)
    await toggleFavorite({ problemId: problem.value.id, nextValue: next })
    const m = await fetchUserStates([problem.value.id])
    state.value = m.get(problem.value.id) ?? null
  } catch (e) {
    errorText.value = e?.message ?? String(e)
  } finally {
    busyFavorite.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <p v-if="errorText" class="alert">{{ errorText }}</p>
    <div v-if="loading" class="muted">加载中…</div>

    <div v-else-if="problem" class="card">
      <div class="head">
        <div class="meta">
          {{ problem.section }} · #{{ problem.source_no }}
          <span class="dot" />
          {{
            problem.question_type === 'fill_blank'
              ? '填空'
              : problem.question_type === 'multiple_choice'
                ? '多选'
                : '单选'
          }}
        </div>
        <button class="btn btn--ghost" :disabled="busyFavorite" @click="onToggleFavorite">
          {{ state?.is_favorite ? '已收藏' : '收藏' }}
        </button>
      </div>

      <div class="stem">{{ problem.stem }}</div>

      <div v-if="optionsList.length" class="options">
        <button
          v-for="o in optionsList"
          :key="o.key"
          class="option"
          :class="{ 'option--picked': picked.includes(o.key) }"
          type="button"
          @click="togglePick(o.key)"
        >
          <span class="key">{{ o.key }}</span>
          <span class="text">{{ o.text }}</span>
        </button>
      </div>

      <div v-else class="muted">该题无选项，点击“显示答案”查看。</div>

      <div class="actions">
        <button class="btn btn--primary" type="button" @click="onSubmit">
          {{ user ? '提交' : '显示答案' }}
        </button>
        <button class="btn" type="button" @click="reveal = !reveal">
          {{ reveal ? '隐藏答案' : '显示答案' }}
        </button>
      </div>

      <div
        v-if="submitResult"
        class="result"
        :class="submitResult.ok === true ? 'result--ok' : submitResult.ok === false ? 'result--bad' : ''"
      >
        {{ submitResult.text }}
      </div>

      <div v-if="reveal" class="answer">
        <div class="label">参考答案</div>
        <div v-if="problem.question_type === 'fill_blank'">{{ problem.answer?.text }}</div>
        <div v-else>{{ (problem.answer?.choices ?? []).join('、') }}</div>
      </div>

      <div v-if="state?.last_answered_at" class="muted small">
        上次作答：{{ new Date(state.last_answered_at).toLocaleString() }} ·
        {{ state.last_is_correct === true ? '正确' : state.last_is_correct === false ? '错误' : '—' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  color: var(--muted);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--border);
  display: inline-block;
}

.stem {
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.options {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.option {
  text-align: left;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  color: var(--text);
}

.option--picked {
  border-color: color-mix(in oklab, var(--primary), #000 40%);
  background: color-mix(in oklab, var(--primary), var(--bg) 90%);
}

.key {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--card);
  font-weight: 700;
}

.text {
  white-space: pre-wrap;
}

.actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.btn--ghost {
  background: transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.result--ok {
  border-color: color-mix(in oklab, var(--ok), #000 35%);
  background: color-mix(in oklab, var(--ok), var(--bg) 86%);
}

.result--bad {
  border-color: color-mix(in oklab, var(--danger), #000 35%);
  background: color-mix(in oklab, var(--danger), var(--bg) 88%);
}

.answer {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed var(--border);
  background: color-mix(in oklab, var(--card), var(--bg) 30%);
}

.label {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.alert {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 12px;
  margin-top: 10px;
}
</style>

