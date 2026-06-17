const badgeMap: Record<string, string> = {
  简单: 'badge-easy',
  中等: 'badge-medium',
  困难: 'badge-hard',
  专家: 'badge-expert',
}

interface DifficultyBadgeProps {
  difficulty: string
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const cls = badgeMap[difficulty] || 'badge-medium'
  return <span className={cls}>{difficulty}</span>
}
