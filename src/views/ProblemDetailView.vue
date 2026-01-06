<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { fetchAdjacentProblemId, fetchProblem, fetchUserStates, markWrong, submitAnswer, toggleFavorite } from '../lib/localApi'
import { settings } from '../lib/settings'
import { getPrevNextFromSession } from '../lib/navSession'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const loading = ref(false)
const errorText = ref('')
const problem = ref(null)

const picked = ref([])
const reveal = ref(false)
const submitResult = ref(null)

const state = ref(null)
const busyFavorite = ref(false)
const navBusy = ref(false)
const prevId = ref(null)
const nextId = ref(null)
const sessionLabel = ref(null)

const optionsList = computed(() => {
  const opts = problem.value?.options
  if (!opts) return []
  return Object.entries(opts).map(([k, v]) => ({ key: k, text: v }))
})

const correctChoices = computed(() => problem.value?.answer?.choices ?? [])
const isMulti = computed(() => problem.value?.question_type === 'multiple_choice')
const showCorrection = computed(() => submitResult.value?.ok === false && picked.value.length > 0)

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

function optionClass(key) {
  if (!showCorrection.value) return { 'option--picked': picked.value.includes(key) }
  const isPicked = picked.value.includes(key)
  const isCorrect = correctChoices.value.includes(key)
  return {
    'option--picked': isPicked,
    'option--correct': isCorrect,
    'option--wrong': isPicked && !isCorrect,
  }
}

async function load() {
  loading.value = true
  errorText.value = ''
  try {
    problem.value = await fetchProblem(id.value)
    const m = await fetchUserStates([problem.value.id])
    state.value = m.get(problem.value.id) ?? null
    const fromSession = getPrevNextFromSession(problem.value.id)
    sessionLabel.value = fromSession.inSession ? fromSession.label : null
    if (fromSession.inSession) {
      prevId.value = fromSession.prevId
      nextId.value = fromSession.nextId
    } else {
      prevId.value = await fetchAdjacentProblemId({
        section: problem.value.section,
        sourceNo: problem.value.source_no,
        direction: 'prev',
      })
      nextId.value = await fetchAdjacentProblemId({
        section: problem.value.section,
        sourceNo: problem.value.source_no,
        direction: 'next',
      })
    }
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

async function onMarkWrong() {
  if (!problem.value) return
  try {
    await markWrong({ problemId: problem.value.id })
    submitResult.value = { ok: false, text: '已加入错题' }
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

async function goPrev() {
  if (!prevId.value) return
  navBusy.value = true
  try {
    await router.push({ name: 'problem', params: { id: prevId.value } })
    picked.value = []
    reveal.value = false
    submitResult.value = null
    await load()
  } finally {
    navBusy.value = false
  }
}

async function goNext() {
  if (!nextId.value) return
  navBusy.value = true
  try {
    await router.push({ name: 'problem', params: { id: nextId.value } })
    picked.value = []
    reveal.value = false
    submitResult.value = null
    await load()
  } finally {
    navBusy.value = false
  }
}

onMounted(load)
watch(settings, () => load(), { deep: true })
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

      <div v-if="sessionLabel" class="session">{{ sessionLabel }}</div>

      <div class="stem">{{ problem.stem }}</div>

      <div v-if="optionsList.length" class="options">
        <button
          v-for="o in optionsList"
          :key="o.key"
          class="option"
          :class="optionClass(o.key)"
          type="button"
          @click="togglePick(o.key)"
        >
          <span class="key">{{ o.key }}</span>
          <span class="text">{{ o.text }}</span>
        </button>
      </div>

      <!-- <div v-else class="muted">该题无选项，点击“显示答案”查看。</div> -->

      <div class="actions">
        <button class="btn" type="button" :disabled="!prevId || navBusy" @click="goPrev">上一题</button>
        <button class="btn btn--primary" type="button" @click="onSubmit">
          提交
        </button>
        <!-- <button class="btn" type="button" @click="reveal = !reveal">
          {{ reveal ? '隐藏答案' : '显示答案' }}
        </button> -->

        <button class="btn" type="button" :disabled="!nextId || navBusy" @click="goNext">下一题</button>
        <button
          v-if="problem.question_type === 'fill_blank'"
          class="btn"
          type="button"
          @click="onMarkWrong"
        >
          加入错题
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
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  max-width: 900px;
  margin: 0 auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  color: var(--muted);
  font-size: 14px;
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
  margin-top: 16px;
  font-size: 20px;
  line-height: 1.7;
  white-space: pre-wrap;
  font-weight: 500;
}

.session {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  width: fit-content;
}

.options {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.option {
  text-align: left;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  color: var(--text);
  font-size: 16px;
  line-height: 1.6;
}

.option--picked {
  border-color: color-mix(in oklab, var(--primary), #000 40%);
  background: color-mix(in oklab, var(--primary), var(--bg) 90%);
}

.option--correct {
  border-color: color-mix(in oklab, var(--ok), #000 40%);
  background: color-mix(in oklab, var(--ok), var(--bg) 92%);
}

.option--wrong {
  border-color: color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 92%);
}

.key {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--card);
  font-weight: 700;
  font-size: 15px;
}

.text {
  white-space: pre-wrap;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
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
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 15px;
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
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  border: 1px dashed var(--border);
  background: color-mix(in oklab, var(--card), var(--bg) 30%);
  font-size: 16px;
  line-height: 1.6;
}

.label {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.alert {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid color-mix(in oklab, var(--danger), #000 40%);
  background: color-mix(in oklab, var(--danger), var(--bg) 86%);
  font-size: 15px;
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 13px;
  margin-top: 14px;
}
</style>
