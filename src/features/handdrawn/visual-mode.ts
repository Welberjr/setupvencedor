export type VisualMode = 'command-center' | 'handdrawn-lab'

export function readVisualMode(value?: string): VisualMode {
  return value === 'command-center' ? 'command-center' : 'handdrawn-lab'
}
