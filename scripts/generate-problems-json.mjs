import fs from 'node:fs'
import path from 'node:path'

function parseAnswerChoices(raw) {
  const letters = raw
    .replace(/\s+/g, '')
    .split(/[、,，/|]/g)
    .flatMap((part) => part.split(''))
    .map((c) => c.toUpperCase())
    .filter((c) => /^[A-Z]$/.test(c))
  return [...new Set(letters)]
}

function parseProblems(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')

  let currentSection = null
  /** @type {Array<any>} */
  const problems = []
  /** @type {any} */
  let current = null
  let lastOptionKey = null

  function finishCurrent() {
    if (!current) return
    if (!current.stem?.trim()) {
      current = null
      lastOptionKey = null
      return
    }
    if (!current.answerRaw?.trim()) {
      current = null
      lastOptionKey = null
      return
    }
    problems.push(current)
    current = null
    lastOptionKey = null
  }

  for (const lineRaw of lines) {
    const line = lineRaw.trimEnd()
    if (!line.trim()) continue

    const sec = line.match(/^第.+?部分：(.+)$/)
    if (sec) {
      finishCurrent()
      currentSection = sec[1].trim()
      continue
    }

    const q = line.match(/^(\d+)\.(.+)$/)
    if (q) {
      finishCurrent()
      current = {
        section: currentSection ?? '未知',
        sourceNo: Number(q[1]),
        stem: q[2].trim(),
        options: {},
        answerRaw: null,
      }
      continue
    }

    if (!current) continue

    const opt = line.match(/^\s*(?:·\s*)?([A-Z])\.(.+)$/)
    if (opt) {
      const key = opt[1].toUpperCase()
      current.options[key] = opt[2].trim()
      lastOptionKey = key
      continue
    }

    const ans = line.match(/^(?:参考答案|答案)[:：]\s*(.+)$/)
    if (ans) {
      current.answerRaw = ans[1].trim()
      continue
    }

    if (lastOptionKey) {
      current.options[lastOptionKey] = `${current.options[lastOptionKey]}\n${line.trim()}`
      continue
    }

    current.stem = `${current.stem}\n${line.trim()}`
  }

  finishCurrent()

  return problems.map((p) => {
    let questionType = 'single_choice'
    if (p.section.includes('多项')) questionType = 'multiple_choice'
    if (p.section.includes('填空')) questionType = 'fill_blank'

    const hasOptions = Object.keys(p.options).length > 0

    /** @type {any} */
    let answer = null
    if (questionType === 'fill_blank' || !hasOptions) {
      answer = { text: p.answerRaw }
    } else {
      answer = { choices: parseAnswerChoices(p.answerRaw) }
    }

    return {
      // id is filled by Supabase; for local JSON we use a stable synthetic id.
      id: `${p.section}:${p.sourceNo}`,
      section: p.section,
      source_no: p.sourceNo,
      question_type: questionType,
      stem: p.stem,
      options: hasOptions ? p.options : null,
      answer,
    }
  })
}

const repoRoot = process.cwd()
const inputPath = path.join(repoRoot, 'problems.txt')
const outputPath = path.join(repoRoot, 'public', 'problems.json')

const inputText = fs.readFileSync(inputPath, 'utf8')
const rows = parseProblems(inputText)

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf8')

console.log(`OK: wrote ${rows.length} problems -> ${path.relative(repoRoot, outputPath)}`)

