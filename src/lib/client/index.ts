import { initGridTrail } from './gridTrail'
import { bindControlClicks, bindScrollControls, bindTocFab, initPageFlags } from './pageBindings'
import { bindProfileCardAnim } from './profileCardAnim'
import { bindCrossPageAnchors, bindNavStartSync, bindSwapHooks } from './swupBindings'

document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new Event('astro:page-load'))
})

initPageFlags()
bindTocFab()
bindScrollControls()
bindNavStartSync()
bindProfileCardAnim()
initGridTrail()
bindSwapHooks()
bindCrossPageAnchors()
bindControlClicks()
