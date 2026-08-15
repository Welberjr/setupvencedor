export type VisualMode = 'command-center' | 'handdrawn-lab'

export function readVisualMode(value?: string): VisualMode {
  return value === 'handdrawn-lab' ? 'handdrawn-lab' : 'command-center'
}
