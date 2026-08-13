export function FirstSteps({ steps }: { steps: string[] }) {
  return <ol aria-label="Primeiro passo" className="first-steps">
    {steps.map((step, index) => <li key={`${index}-${step}`}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}
  </ol>
}
