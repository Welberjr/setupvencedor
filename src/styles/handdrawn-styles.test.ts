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
