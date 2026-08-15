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
