export const HEADING_SCROLL_OFFSET = 80

export function findAnchorTarget(id: string): HTMLElement | null {
  let el = document.getElementById(id)
  if (el) return el
  try {
    const decoded = decodeURIComponent(id)
    if (decoded !== id) {
      el = document.getElementById(decoded)
      if (el) return el
    }
  } catch {}
  const encoded = encodeURIComponent(id)
  if (encoded !== id) {
    el = document.getElementById(encoded)
    if (el) return el
  }
  return null
}

export function smoothScrollToHeading(id: string): HTMLElement | null {
  const el = findAnchorTarget(id)
  if (!el) return null
  const top = el.getBoundingClientRect().top + window.scrollY - HEADING_SCROLL_OFFSET
  // 与 swupBindings 的同款滚动一致：尊重 prefers-reduced-motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  return el
}

type ExecCommandFn = (this: Document, commandId: string) => boolean

function execCopyFallback() {
  const execCommand = (document as unknown as { execCommand?: ExecCommandFn }).execCommand
  if (typeof execCommand !== 'function') return
  execCommand.call(document, 'copy')
}

function copyTextFallback(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    execCopyFallback()
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta)
}

interface CopyWindow {
  __blogCopyIdleHtml?: string
  __blogCopyDoneHtml?: string
  __blogCopyCode?: (btn: HTMLElement) => void
  __blogToggleCodeWrap?: (btn: HTMLElement) => void
  __blogCodeWrapLabels?: { wrap: string; unwrap: string; aria: string }
}

// 换行 / 不换行切换：切换 code-block 的 is-wrapped 类（样式见 markdown.css：
// 折行时长代码行占多个视觉行，行号会错位，故同时隐藏行号栏）
function applyCodeWrapState(btn: HTMLElement, on: boolean) {
  const w = window as unknown as CopyWindow
  btn.setAttribute('aria-pressed', on ? 'true' : 'false')
  const labels = w.__blogCodeWrapLabels
  if (labels) btn.title = on ? labels.unwrap : labels.wrap
}

export function bindCopyCode() {
  const w = window as unknown as CopyWindow
  w.__blogCopyCode = (btn: HTMLElement) => {
    const block = btn.closest('.code-block, .diff-view')
    const code = block?.querySelector('code, .diff-view-lines')
    if (!code) return
    const text = code.textContent || ''
    const done = () => {
      btn.innerHTML = w.__blogCopyDoneHtml ?? ''
      btn.classList.add('is-success')
      setTimeout(() => {
        btn.innerHTML = w.__blogCopyIdleHtml ?? ''
        btn.classList.remove('is-success')
      }, 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => {
          copyTextFallback(text)
          done()
        })
    } else {
      copyTextFallback(text)
      done()
    }
  }
  w.__blogToggleCodeWrap = (btn: HTMLElement) => {
    const block = btn.closest('.code-block')
    if (!block) return
    applyCodeWrapState(btn, block.classList.toggle('is-wrapped'))
  }
}

// 代码块换行按钮的 aria-label 与初始提示文案由 PostPage 注入 i18n 后回填
export function bindCodeWrapLabels() {
  const w = window as unknown as CopyWindow
  const labels = w.__blogCodeWrapLabels
  if (!labels) return
  document.querySelectorAll<HTMLElement>('.code-wrap').forEach((btn) => {
    btn.setAttribute('aria-label', labels.aria)
    const on = !!btn.closest('.code-block')?.classList.contains('is-wrapped')
    applyCodeWrapState(btn, on)
  })
}

export function bindPostBodyAnchors(postBody: HTMLElement) {
  postBody.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement | null
    const link = target?.closest('a') as HTMLAnchorElement | null
    if (!link) return
    const href = link.getAttribute('href') || ''
    if (!href.startsWith('#')) return
    const raw = href.slice(1)
    if (!raw) return
    const el = findAnchorTarget(raw)
    if (!el) return
    ev.preventDefault()
    smoothScrollToHeading(el.id)
    history.replaceState(history.state, '', `#${el.id}`)
  })
}
