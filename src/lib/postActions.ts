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
  window.scrollTo({ top, behavior: 'smooth' })
  return el
}

function copyTextFallback(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta)
}

interface CopyWindow {
  __blogCopyIdleHtml?: string
  __blogCopyDoneHtml?: string
  __blogCopyCode?: (btn: HTMLElement) => void
}

export function bindCopyCode() {
  const w = window as unknown as CopyWindow
  w.__blogCopyCode = (btn: HTMLElement) => {
    const block = btn.closest('.code-block')
    const code = block?.querySelector('code')
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
