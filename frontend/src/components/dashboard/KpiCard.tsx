import { type LucideIcon } from 'lucide-react'

type KpiVariant = 'green' | 'cyan' | 'amber'

const variantStyles: Record<KpiVariant, { iconBg: string; iconColor: string }> = {
  green: { iconBg: 'bg-green-50',  iconColor: 'text-green-500' },
  cyan:  { iconBg: 'bg-cyan-50',   iconColor: 'text-cyan-600'  },
  amber: { iconBg: 'bg-signal/10',  iconColor: 'text-signal' },
}

interface Props {
  icon: LucideIcon
  label: string
  value: number | string
  sublabel: string
  variant: KpiVariant
  loading: boolean
}

export default function KpiCard({ icon: Icon, label, value, sublabel, variant, loading }: Props) {
  const { iconBg, iconColor } = variantStyles[variant]

  return (
    <div className="rounded-2xl p-5 bg-white shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-400">
          {label}
        </p>
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg}`}>
          <Icon size={13} className={iconColor} />
        </div>
      </div>

      <p className="font-mono font-extrabold text-ink leading-none" style={{ fontSize: 44 }}>
        {loading ? '—' : value}
      </p>

      <p className="text-[12px] text-slate-400">{sublabel}</p>
    </div>
  )
}
