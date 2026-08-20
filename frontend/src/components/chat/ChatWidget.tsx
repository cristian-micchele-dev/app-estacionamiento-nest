import { useRef, useState, useEffect } from 'react'
import {
  Activity, DollarSign, Car, Wallet, CreditCard,
  BarChart2, Tag, Star, BadgeCheck, CalendarClock,
  X, Trash2, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { chatService, type InsightKey } from '@/services/chat.service'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS: { label: string; sublabel: string; key: InsightKey; icon: React.ReactNode }[] = [
  { label: 'Sesiones activas', sublabel: 'En tiempo real', key: 'active-sessions', icon: <Activity /> },
  { label: 'Recaudación hoy', sublabel: 'Total del día', key: 'today-revenue', icon: <DollarSign /> },
  { label: 'Vehículos adentro', sublabel: 'Lista actual', key: 'vehicles-inside', icon: <Car /> },
  { label: 'Diferencia de caja', sublabel: 'Último turno', key: 'last-shift-difference', icon: <Wallet /> },
  { label: 'Pagos con tarjeta', sublabel: 'Día de hoy', key: 'card-payments-today', icon: <CreditCard /> },
  { label: 'Ingresos del mes', sublabel: 'Mes actual', key: 'monthly-entries', icon: <BarChart2 /> },
  { label: 'Tarifa top', sublabel: 'Más utilizada', key: 'top-tariff', icon: <Tag /> },
  { label: 'Vehículo frecuente', sublabel: 'Más ingresos', key: 'top-vehicle', icon: <Star /> },
  { label: 'Abonos activos', sublabel: 'Vigentes', key: 'active-passes', icon: <BadgeCheck /> },
  { label: 'Abonos por vencer', sublabel: 'Próx. 7 días', key: 'expiring-passes', icon: <CalendarClock /> },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600&display=swap');

  .chat-panel {
    font-family: 'Outfit', sans-serif;
    background: rgba(10, 12, 18, 0.97);
    border: 1px solid rgba(245, 158, 11, 0.2);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.05), 0 24px 48px rgba(0,0,0,0.6), 0 0 80px rgba(245,158,11,0.04);
    backdrop-filter: blur(20px);
  }

  .dark .chat-panel {
    background: rgba(8, 10, 16, 0.98);
  }

  .chat-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px);
    background-size: 24px 24px;
    border-radius: inherit;
    pointer-events: none;
  }

  .chat-header {
    background: rgba(245, 158, 11, 0.06);
    border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .suggestion-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 14px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .suggestion-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(245,158,11,0.08), transparent 70%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .suggestion-card:hover {
    border-color: rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(245,158,11,0.1);
  }

  .suggestion-card:hover::after { opacity: 1; }

  .suggestion-card:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .suggestion-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    color: #f59e0b;
    transition: all 0.2s ease;
  }

  .suggestion-card:hover .suggestion-icon {
    background: rgba(245,158,11,0.18);
    box-shadow: 0 0 12px rgba(245,158,11,0.2);
  }

  .suggestion-label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    line-height: 1.3;
    margin-bottom: 2px;
  }

  .suggestion-sublabel {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    font-family: 'JetBrains Mono', monospace;
  }

  .msg-user {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #0a0c12;
    border-radius: 16px 16px 4px 16px;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 14px;
    max-width: 78%;
    align-self: flex-end;
    box-shadow: 0 4px 12px rgba(245,158,11,0.3);
  }

  .msg-assistant {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px 16px 16px 16px;
    font-size: 13px;
    color: rgba(255,255,255,0.85);
    padding: 10px 14px;
    max-width: 85%;
    align-self: flex-start;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .typing-dots span {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #f59e0b;
    margin: 0 2px;
    animation: typing 1.2s ease-in-out infinite;
  }

  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-4px); }
  }

  .chat-fab {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(245,158,11,0.4), 0 0 0 0 rgba(245,158,11,0.3);
    animation: fab-pulse 3s ease-in-out infinite;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    color: #0a0c12;
  }

  .chat-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(245,158,11,0.55), 0 0 0 8px rgba(245,158,11,0.08);
    animation: none;
  }

  @keyframes fab-pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(245,158,11,0.4), 0 0 0 0 rgba(245,158,11,0.2); }
    50% { box-shadow: 0 4px 20px rgba(245,158,11,0.4), 0 0 0 10px rgba(245,158,11,0); }
  }

  .chat-scrollbar::-webkit-scrollbar { width: 4px; }
  .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 2px; }

  .icon-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.4);
    transition: all 0.15s ease;
  }

  .icon-btn:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.15);
  }

  .chat-footer {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) return null

  async function handleAsk(label: string, key: InsightKey) {
    if (loading) return
    setMessages((prev) => [...prev, { role: 'user', content: label }])
    setLoading(true)
    try {
      const { answer } = await chatService.insight(key)
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Error al consultar la base de datos.'
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <>
      {open && (
        <div
          className="chat-panel"
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '16px',
            zIndex: 50,
            width: '380px',
            maxHeight: 'min(600px, calc(100vh - 96px))',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="chat-header" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="live-dot" />
                <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#22c55e', letterSpacing: '0.08em' }}>
                  EN VIVO
                </span>
              </div>
              <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
                Asistente de datos
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {messages.length > 0 && (
                <button className="icon-btn" onClick={() => setMessages([])} title="Nueva consulta">
                  <Trash2 size={13} />
                </button>
              )}
              <button className="icon-btn" onClick={() => setOpen(false)}>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            className="chat-scrollbar"
            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
          >
            {messages.length === 0 ? (
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: '14px', letterSpacing: '0.06em' }}>
                  SELECCIONÁ UNA CONSULTA
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.key}
                      className="suggestion-card"
                      onClick={() => handleAsk(s.label, s.key)}
                      disabled={loading}
                    >
                      <div className="suggestion-icon">
                        {s.icon && (
                          <span style={{ display: 'flex', width: 16, height: 16 }}>
                            {s.icon}
                          </span>
                        )}
                      </div>
                      <div className="suggestion-label">{s.label}</div>
                      <div className="suggestion-sublabel">{s.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={cn(msg.role === 'user' ? 'msg-user' : 'msg-assistant')}>
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="msg-assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.3)' }}>
                      consultando
                    </span>
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Footer */}
          {messages.length > 0 && !loading && (
            <div className="chat-footer">
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
                ↑ TRASH para nueva consulta
              </span>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className="chat-fab"
        style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 50 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente de datos"
      >
        {open
          ? <X size={20} />
          : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="12" cy="10" r="1.5" fill="currentColor" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
            </svg>
          )
        }
      </button>
    </>
  )
}
