const FACE_SIZE = 224

const MAX_X = 14
const MAX_Y = 16
const RANGE = 280
const EASE = 0.15

const SLIDE_DIST = 168
const SPEED_OUT = 0.26
const SPEED_IN = 0.2

const BLINK_SCALE = 1 / 2.5
const CLOSE_HOLD = 1500

const SLEEP_DELAY = 5000

const TOUCH_TAP_MS = 300
const TOUCH_TAP_MOVE = 10
const TOUCH_SLIDE_DIST = 24
const EMULATED_MOUSE_GUARD = 500

interface TouchStart {
  x: number
  y: number
  at: number
  onPet: boolean
  moved: boolean
  slid: boolean
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

let petLayoutSync: (() => void) | null = null

export function syncPet() {
  petLayoutSync?.()
}

export function initPet() {
  const root = document.querySelector<HTMLElement>('[data-pet]')
  if (!root || root.dataset.petReady === '1') return
  const petEl: HTMLElement = root
  const slide = petEl.querySelector<HTMLElement>('[data-pet-slide]')
  const eyes = petEl.querySelector<HTMLElement>('[data-pet-eyes]')
  const eyeEls = Array.from(petEl.querySelectorAll<HTMLElement>('[data-pet-eye]'))
  if (!slide || !eyes || eyeEls.length === 0) return
  root.dataset.petReady = '1'

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  let scale = 1
  const measure = () => {
    const width = petEl.getBoundingClientRect().width
    if (width > 0) scale = width / FACE_SIZE
  }
  measure()
  new ResizeObserver(measure).observe(petEl)

  const syncAnchor = () => {
    const main = document.querySelector<HTMLElement>('#swup-container > main')
    if (!main) return
    const left = main.getBoundingClientRect().left
    petEl.style.setProperty('--pet-anchor-x', `${left.toFixed(2)}px`)
  }

  const syncBottom = () => {
    const lowest = Array.from(
      document.querySelectorAll<HTMLElement>('.scroll-control-nav, .music-fab'),
    ).reduce((max, el) => {
      const rect = el.getBoundingClientRect()
      return rect.height > 0 ? Math.max(max, rect.bottom) : max
    }, 0)
    if (lowest <= 0) return
    const offset = window.innerHeight - lowest
    if (offset > 0) petEl.style.setProperty('--pet-bottom', `${offset.toFixed(2)}px`)
  }

  const syncLayout = () => {
    syncAnchor()
    syncBottom()
  }

  syncLayout()
  const scheduleLayout = () => requestAnimationFrame(syncLayout)
  window.addEventListener('resize', scheduleLayout)
  new ResizeObserver(scheduleLayout).observe(document.documentElement)
  window.visualViewport?.addEventListener('resize', scheduleLayout)
  document.addEventListener('astro:after-swap', scheduleLayout)
  document.addEventListener('astro:page-load', scheduleLayout)

  petLayoutSync = () => {
    syncLayout()
    measure()
  }

  let slidePhase = 0
  let slideDir = 0
  let slideOffset = 0

  let blink = 1
  let closed = false
  let closeValue = 1
  let closeTimer = 0
  let lastActivity = Date.now()
  let isSleeping = false

  let mouseX = 0
  let mouseY = 0
  let active = false
  const cur = { x: 0, y: 0 }
  const tgt = { x: 0, y: 0 }

  function compute() {
    if (!active) {
      tgt.x = 0
      tgt.y = 0
      return
    }

    const rect = petEl.getBoundingClientRect()
    const dx = mouseX - (rect.left + rect.width / 2)
    const dy = mouseY - (rect.top + rect.height / 2)
    const dist = Math.hypot(dx, dy)

    if (dist < 0.001) {
      tgt.x = 0
      tgt.y = 0
      return
    }

    const maxX = MAX_X * scale
    const maxY = MAX_Y * scale
    const k = Math.min(1, dist / (RANGE * scale))
    tgt.x = clamp((dx / dist) * maxX * k, -maxX, maxX)
    tgt.y = clamp((dy / dist) * maxY * k, -maxY, maxY)
  }

  function reset() {
    active = false
    compute()
  }

  function wake() {
    lastActivity = Date.now()
    isSleeping = false
  }

  const isOverPet = (x: number, y: number) => {
    const rect = petEl.getBoundingClientRect()
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }
  let touchStart: TouchStart | null = null
  let lastTouchAt = 0

  const lookAt = (x: number, y: number) => {
    mouseX = x
    mouseY = y
    active = true
    wake()
    compute()
  }

  const blinkOnce = () => {
    blink = BLINK_SCALE
  }

  const closeFor = (holdMs: number) => {
    closed = true
    window.clearTimeout(closeTimer)
    closeTimer = window.setTimeout(() => {
      closed = false
    }, holdMs)
  }

  const slideOut = (dir: 1 | -1) => {
    if (reduceMotion.matches || slidePhase !== 0) return false
    slideDir = dir
    slidePhase = 1
    return true
  }

  window.addEventListener(
    'mousemove',
    (e) => {
      lookAt(e.clientX, e.clientY)
    },
    { passive: true },
  )

  document.addEventListener('mouseleave', reset)
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget) reset()
  })
  window.addEventListener('blur', reset)

  window.addEventListener(
    'wheel',
    (e) => {
      wake()
      slideOut(e.deltaY > 0 ? -1 : 1)
    },
    { passive: true },
  )

  window.addEventListener('mousedown', (e) => {
    wake()
    if (Date.now() - lastTouchAt < EMULATED_MOUSE_GUARD) return
    if (e.button === 0) blinkOnce()
    else if (e.button === 2) closeFor(CLOSE_HOLD)
  })

  document.addEventListener('contextmenu', (e) => {
    if (isOverPet(e.clientX, e.clientY)) e.preventDefault()
  })

  window.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0]
      if (!touch) return
      lastTouchAt = Date.now()
      lookAt(touch.clientX, touch.clientY)

      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        at: lastTouchAt,
        onPet: isOverPet(touch.clientX, touch.clientY),
        moved: false,
        slid: false,
      }
    },
    { passive: true },
  )

  window.addEventListener(
    'touchmove',
    (e) => {
      const touch = e.touches[0]
      if (!touch) return
      lastTouchAt = Date.now()
      lookAt(touch.clientX, touch.clientY)

      if (!touchStart) return
      const dx = touch.clientX - touchStart.x
      const dy = touch.clientY - touchStart.y
      if (Math.hypot(dx, dy) > TOUCH_TAP_MOVE) touchStart.moved = true
      if (touchStart.onPet && !touchStart.slid && Math.abs(dy) >= TOUCH_SLIDE_DIST) {
        touchStart.slid = slideOut(dy > 0 ? 1 : -1)
      }
    },
    { passive: true },
  )

  const endTouch = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    lastTouchAt = Date.now()
    if (touchStart && touch && !touchStart.moved && !touchStart.slid) {
      const held = lastTouchAt - touchStart.at
      const dist = Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y)
      if (held <= TOUCH_TAP_MS && dist <= TOUCH_TAP_MOVE) blinkOnce()
    }
    touchStart = null
    reset()
  }
  window.addEventListener('touchend', endTouch, { passive: true })
  window.addEventListener('touchcancel', endTouch, { passive: true })

  let lastSlideText = ''
  let lastEyesText = ''
  let lastEyeScale = ''

  compute()

  const tick = () => {
    if (!isSleeping && Date.now() - lastActivity > SLEEP_DELAY) isSleeping = true

    cur.x += (tgt.x - cur.x) * EASE
    cur.y += (tgt.y - cur.y) * EASE
    if (Math.abs(tgt.x - cur.x) < 0.01) cur.x = tgt.x
    if (Math.abs(tgt.y - cur.y) < 0.01) cur.y = tgt.y

    blink += (1 - blink) * 0.22

    closeValue += ((closed || isSleeping ? BLINK_SCALE : 1) - closeValue) * 0.18

    if (slidePhase === 1) {
      const goal = slideDir * SLIDE_DIST * scale
      slideOffset += (goal - slideOffset) * SPEED_OUT
      if (Math.abs(goal - slideOffset) < 1) {
        slideOffset = -goal
        slidePhase = 2
      }
    } else if (slidePhase === 2) {
      slideOffset += (0 - slideOffset) * SPEED_IN
      if (Math.abs(slideOffset) < 0.5) {
        slideOffset = 0
        slidePhase = 0
      }
    }

    const slideText = slideOffset.toFixed(2)
    if (slideText !== lastSlideText) {
      lastSlideText = slideText
      slide.style.transform = `translate3d(0, ${slideText}px, 0)`
    }

    const eyesText = `${cur.x.toFixed(2)},${cur.y.toFixed(2)}`
    if (eyesText !== lastEyesText) {
      lastEyesText = eyesText
      eyes.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`
    }

    const eyeScale = Math.max(BLINK_SCALE, blink * closeValue).toFixed(3)
    if (eyeScale !== lastEyeScale) {
      lastEyeScale = eyeScale
      for (const el of eyeEls) el.style.transform = `scaleY(${eyeScale})`
    }

    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
