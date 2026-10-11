// Barra do faturamento acumulado contra o limite anual (componentes.md, "LimitBar").
// Equivale a um componente Blade <x-limit-bar>. Trilho surface-tint, zona de projeção
// surface-tint-strong e preenchimento accent. Nunca passa de 100% da largura.
import * as React from "react"

type LimitBarProps = {
  /** Porcentagem do limite já usada. */
  percentual: number
  /** Porcentagem projetada para dezembro, ou null se não houver projeção. */
  projecao: number | null
  /** Texto sob o fim do preenchimento: "hoje" no ano corrente. */
  rotuloAtual: string
}

// Os marcadores ficam centralizados no ponto; perto das pontas sairiam do cartão.
const MARGEM = 4
// Distância mínima entre os dois marcadores para os textos não se sobreporem.
const DISTANCIA_MINIMA = 16

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function LimitBar({ percentual, projecao, rotuloAtual }: LimitBarProps) {
  const atual = limitar(percentual, 0, 100)
  const projetado = projecao === null ? null : limitar(projecao, atual, 100)

  const marcaAtual = limitar(atual, MARGEM, 100 - MARGEM)
  const marcaProjecao = projetado === null ? null : limitar(projetado, MARGEM, 100 - MARGEM)
  const mostraProjecao = marcaProjecao !== null && marcaProjecao - marcaAtual >= DISTANCIA_MINIMA

  return (
    <div className="relative pb-[26px]">
      <div className="relative h-2.5 overflow-hidden rounded-pill bg-surface-tint">
        {projetado !== null ? (
          <div
            className="absolute inset-y-0 left-0 bg-surface-tint-strong"
            style={{ width: `${projetado}%` }}
          />
        ) : null}
        <div
          className="absolute inset-y-0 left-0 rounded-pill bg-accent"
          style={{ width: `${atual}%` }}
        />
      </div>
      <div
        className="absolute bottom-0 -translate-x-1/2 text-caption font-semibold whitespace-nowrap"
        style={{ left: `${marcaAtual}%` }}
      >
        {rotuloAtual}
      </div>
      {mostraProjecao ? (
        <div
          className="absolute bottom-0 -translate-x-1/2 text-caption whitespace-nowrap text-ink-muted"
          style={{ left: `${marcaProjecao}%` }}
        >
          projeção dez.
        </div>
      ) : null}
    </div>
  )
}

export { LimitBar }
