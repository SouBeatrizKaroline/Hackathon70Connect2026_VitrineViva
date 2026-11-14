// Card compacto com a justificativa do agrupamento de um desafio coletivo,
// reutilizado na página da startup e no painel da associação.
import { Sparkles } from 'lucide-react'

interface ChallengeClusterReasonProps {
  reason?: string | null
  title?: string
}

export function ChallengeClusterReason({
  reason,
  title = 'Justificativa do agrupamento',
}: ChallengeClusterReasonProps) {
  if (!reason || !reason.trim()) return null

  return (
    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-xs text-amber-950 space-y-0.5">
      <span className="font-semibold flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        {title}:
      </span>
      <p className="leading-relaxed">{reason}</p>
    </div>
  )
}

export default ChallengeClusterReason
