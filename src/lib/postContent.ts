export function initImageFrames() {
  document
    .querySelectorAll<HTMLElement>('.post-content .img-frame:not(.is-loaded):not(.is-error)')
    .forEach((frame) => {
      const img = frame.querySelector<HTMLImageElement>('img')
      if (!img) {
        frame.classList.add('is-loaded')
        return
      }
      if (img.complete && img.naturalWidth > 0) {
        frame.classList.add('is-loaded')
        return
      }
      img.addEventListener('load', () => frame.classList.add('is-loaded'), { once: true })
      img.addEventListener('error', () => frame.classList.add('is-error'), { once: true })
    })
}

export function initReadingReveal() {
  const body = document.querySelector<HTMLElement>('.post-content')
  if (!body) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!('IntersectionObserver' in window)) return
  const blocks = Array.from(body.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && !el.classList.contains('img-frame'),
  )
  if (!blocks.length) return
  body.classList.add('reading-reveal')
  const vh = window.innerHeight
  let stagger = 0
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const t = entry.target as HTMLElement
        if (entry.isIntersecting) {
          t.classList.add('reveal-in')
        } else {
          t.style.transitionDelay = ''
          t.classList.remove('reveal-in')
        }
      }
    },
    { rootMargin: '0px 0px -4% 0px', threshold: 0.01 },
  )
  for (const el of blocks) {
    const top = el.getBoundingClientRect().top
    if (top < vh * 0.92) {
      el.style.transitionDelay = `${Math.min(stagger * 70, 480)}ms`
      stagger++
    }
    io.observe(el)
  }
}
