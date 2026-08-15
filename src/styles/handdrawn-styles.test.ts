import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

function readStyle(path: string) {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function mountStyle(css: string) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  return style
}

it('applies paper tokens to the laboratory without changing the official shell', () => {
  const style = mountStyle(readStyle('src/styles/handdrawn-tokens.css'))
  const official = document.createElement('main')
  const laboratory = document.createElement('main')
  laboratory.className = 'handdrawn-lab'
  document.body.append(official, laboratory)

  expect(getComputedStyle(laboratory).getPropertyValue('--paper').trim()).toBe('#f8f0dc')
  expect(getComputedStyle(laboratory).getPropertyValue('--ink').trim()).toBe('#201f1b')
  expect(getComputedStyle(laboratory).getPropertyValue('--brand-green').trim()).toBe('#caff3d')
  expect(getComputedStyle(official).getPropertyValue('--paper').trim()).toBe('')

  style.remove()
  official.remove()
  laboratory.remove()
})

it('draws the laboratory rail without leaking the border into the official shell', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-tokens.css')}\n${readStyle('src/styles/handdrawn-shell.css')}`)
  const official = document.createElement('main')
  const laboratory = document.createElement('main')
  laboratory.className = 'handdrawn-lab'
  official.innerHTML = '<aside class="command-rail"></aside>'
  laboratory.innerHTML = '<aside class="command-rail"></aside>'
  document.body.append(official, laboratory)

  expect(getComputedStyle(laboratory.querySelector('.command-rail')!).borderRightWidth).toBe('2px')
  expect(getComputedStyle(official.querySelector('.command-rail')!).borderRightWidth).not.toBe('2px')

  style.remove()
  official.remove()
  laboratory.remove()
})

it('publishes mobile and reduced-motion rules as valid CSS media contracts', () => {
  const style = mountStyle(readStyle('src/styles/handdrawn-responsive.css'))
  const mediaRules = Array.from(style.sheet?.cssRules ?? []).filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)

  expect(mediaRules.map((rule) => rule.conditionText)).toContain('(max-width: 820px)')
  expect(mediaRules.map((rule) => rule.conditionText)).toContain('(prefers-reduced-motion: reduce)')
  expect(mediaRules.every((rule) => Array.from(rule.cssRules).every((nestedRule) => nestedRule.cssText.includes('.handdrawn-lab')))).toBe(true)

  style.remove()
})

it('styles rendered Explore cards only inside the laboratory', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-tokens.css')}\n${readStyle('src/styles/handdrawn-explore.css')}`)
  const official = document.createElement('main')
  const laboratory = document.createElement('main')
  laboratory.className = 'handdrawn-lab'
  official.innerHTML = '<article class="catalog-card"></article><article class="catalog-card"></article>'
  laboratory.innerHTML = '<article class="catalog-card"></article><article class="catalog-card"></article>'
  document.body.append(official, laboratory)

  expect(getComputedStyle(laboratory.querySelectorAll('.catalog-card')[1]).transform).toBe('rotate(0.35deg)')
  expect(getComputedStyle(official.querySelectorAll('.catalog-card')[1]).transform).not.toBe('rotate(0.35deg)')

  style.remove()
  official.remove()
  laboratory.remove()
})

it('publishes each Explore control selector under the laboratory root', () => {
  const style = mountStyle(readStyle('src/styles/handdrawn-explore.css'))
  const selectors = Array.from(style.sheet?.cssRules ?? [])
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .flatMap((rule) => rule.selectorText.split(',').map((selector) => selector.trim()))

  expect(selectors).toContain('.handdrawn-lab .explore-search')
  expect(selectors).toContain('.handdrawn-lab .explore-submenu')
  expect(selectors).toContain('.handdrawn-lab .catalog-card')
  expect(selectors).toContain('.handdrawn-lab .catalog-pagination')
  expect(selectors.filter((selector) => selector.includes('catalog-card')).every((selector) => selector.startsWith('.handdrawn-lab '))).toBe(true)

  style.remove()
})

it('defines visible focus, touch targets, mobile card stability and motion reduction', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-shell.css')}\n${readStyle('src/styles/handdrawn-responsive.css')}`)
  const rootRules = Array.from(style.sheet?.cssRules ?? [])
  const focusRule = rootRules.find((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText.includes(':focus-visible'))
  const mediaRules = rootRules.filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
  const tabletRule = mediaRules.find((rule) => rule.conditionText === '(max-width: 820px)')
  const mobileRule = mediaRules.find((rule) => rule.conditionText === '(max-width: 540px)')
  const reducedMotionRule = mediaRules.find((rule) => rule.conditionText === '(prefers-reduced-motion: reduce)')

  expect(focusRule?.style.outline).toBe('3px solid #174f74')
  expect(focusRule?.style.outlineOffset).toBe('3px')
  expect(Array.from(tabletRule?.cssRules ?? []).some((rule) => rule instanceof CSSStyleRule && rule.style.minHeight === '44px')).toBe(true)
  expect(Array.from(mobileRule?.cssRules ?? []).some((rule) => rule instanceof CSSStyleRule && rule.selectorText.includes('.catalog-card') && rule.style.transform === 'none')).toBe(true)
  expect(Array.from(reducedMotionRule?.cssRules ?? []).some((rule) => rule instanceof CSSStyleRule
    && rule.style.transition === 'none'
    && rule.style.animation === 'none')).toBe(true)

  style.remove()
})

it('frames the approved navigation icons only inside the handdrawn laboratory', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-tokens.css')}\n${readStyle('src/styles/handdrawn-shell.css')}`)
  const rules = Array.from(style.sheet?.cssRules ?? []).filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
  const iconRule = rules.find((rule) => rule.selectorText === '.handdrawn-lab .main-nav .command-icon')
  const assistantRule = rules.find((rule) => rule.selectorText === '.handdrawn-lab .main-nav .command-icon-assistant')

  expect(iconRule?.style.border).toBe('2px solid var(--ink)')
  expect(iconRule?.style.background).toBe('var(--note-blue)')
  expect(assistantRule?.style.background).toBe('var(--note-lilac)')
  expect(rules.some((rule) => rule.selectorText === '.main-nav .command-icon')).toBe(false)

  style.remove()
})

it('keeps internal illustrated heroes compact without shrinking the Explore cover', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-tokens.css')}\n${readStyle('src/styles/handdrawn-explore.css')}\n${readStyle('src/styles/handdrawn-pages.css')}`)
  const laboratory = document.createElement('main')
  laboratory.className = 'handdrawn-lab'
  laboratory.innerHTML = `
    <section class="explore-page"><section class="illustrated-hero"></section></section>
    <section class="inner-page"><section class="illustrated-hero"><figure class="illustrated-hero-artwork"></figure></section></section>
  `
  document.body.append(laboratory)

  const exploreHero = getComputedStyle(laboratory.querySelector('.explore-page .illustrated-hero')!)
  const innerHero = getComputedStyle(laboratory.querySelector('.inner-page .illustrated-hero')!)
  const innerArtwork = getComputedStyle(laboratory.querySelector('.inner-page .illustrated-hero-artwork')!)

  expect(innerHero.maxWidth).toBe('1400px')
  expect(innerHero.padding).toBe('40px')
  expect(innerArtwork.maxWidth).toBe('640px')
  expect(exploreHero.maxWidth).not.toBe('1400px')

  style.remove()
  laboratory.remove()
})

it('makes the laboratory brand, workspace label and signed-in identity legible', () => {
  const style = mountStyle(`${readStyle('src/styles/handdrawn-tokens.css')}\n${readStyle('src/styles/handdrawn-shell.css')}`)
  const official = document.createElement('main')
  const laboratory = document.createElement('main')
  laboratory.className = 'handdrawn-lab'
  const shell = `
    <aside class="command-rail"><a class="brand"><span class="brand-mark"></span><span>Setup Vencedor</span></a></aside>
    <header class="topbar"><div><p class="eyebrow">WORKSPACE / BIBLIOTECA</p><p class="topbar-title">A central de decisões técnicas da sua equipe.</p></div><div class="identity"><span class="avatar">W</span><span>welber@example.com</span></div></header>
  `
  official.innerHTML = shell
  laboratory.innerHTML = shell
  document.body.append(official, laboratory)

  const brand = getComputedStyle(laboratory.querySelector('.brand')!)
  const mark = getComputedStyle(laboratory.querySelector('.brand-mark')!)
  const eyebrow = getComputedStyle(laboratory.querySelector('.topbar .eyebrow')!)
  const title = getComputedStyle(laboratory.querySelector('.topbar-title')!)
  const identity = getComputedStyle(laboratory.querySelector('.identity')!)
  const avatar = getComputedStyle(laboratory.querySelector('.avatar')!)
  const rules = Array.from(style.sheet?.cssRules ?? []).filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
  const identityRule = rules.find((rule) => rule.selectorText === '.handdrawn-lab .identity')
  const avatarRule = rules.find((rule) => rule.selectorText === '.handdrawn-lab .avatar')

  expect(brand.flexDirection).toBe('column')
  expect(brand.textAlign).toBe('center')
  expect(brand.color).toBe('var(--ink)')
  expect(mark.width).toBe('48px')
  expect(eyebrow.color).toBe('rgb(78, 88, 105)')
  expect(title.color).toBe('var(--ink-muted)')
  expect(identityRule?.style.background).toBe('var(--paper-raised)')
  expect(identity.color).toBe('var(--ink)')
  expect(avatarRule?.style.background).toBe('var(--brand-green)')
  expect(avatar.color).toBe('var(--ink)')
  expect(getComputedStyle(official.querySelector('.brand')!).flexDirection).not.toBe('column')

  style.remove()
  official.remove()
  laboratory.remove()
})
