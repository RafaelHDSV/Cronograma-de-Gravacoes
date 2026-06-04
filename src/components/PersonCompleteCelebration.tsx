interface Props {
  personName: string
  onDismiss: () => void
}

export function PersonCompleteCelebration({ personName, onDismiss }: Props) {
  return (
    <div className="celebration-overlay" role="alertdialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className="celebration-panel">
        <p className="celebration-emoji" aria-hidden="true">
          🎉
        </p>
        <h2 id="celebration-title" className="celebration-title">
          Parabéns, {personName}!
        </h2>
        <p className="celebration-desc">Todas as gravações desta pessoa foram concluídas no cronograma.</p>
        <button type="button" className="btn primary" onClick={onDismiss}>
          Continuar
        </button>
      </div>
    </div>
  )
}
