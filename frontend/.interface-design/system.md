# Interface Design System — ParkAdmin

## Direction & Feel

**Domain:** Parking lot administration — flow de vehículos, capacidad, rotación, turno de cajero, ticket de admisión.

**Tone:** Control board tranquilo. Informativo de un vistazo. No clínico, no genérico. Como el panel de un supervisor que abre el día.

**Signature:** Contador digital estilo cartel de parking garage — número enorme en JetBrains Mono ámbar sobre dark card asfalto. Zero-padded ("03") para reforzar el estilo de display digital.

---

## Palette

| Token | Value | Uso |
|-------|-------|-----|
| Canvas | `#F8FAFC` | Fondo de página — frío-azulado, como cemento |
| Card surface | `#FFFFFF` | Cards, panels |
| Hero / asfalto | `#0F1723` | Hero cards, sidebar — el dark principal |
| Accent ámbar | `#F59E0B` | CTA principal, números hero, énfasis |
| Cyan | `#0891B2` | Abonos mensuales |
| Green | `#22C55E` | Activo, entrada, éxito |
| Red | `#EF4444` | Eliminar, cerrar, error |
| Blue | `#3B82F6` | Estacionamiento, LogIn |
| Amber | `#F59E0B` | Turnos, tiempo transcurrido |
| Purple | `#7C3AED` | Usuarios |
| Text primary | `#0F1723` | Títulos, datos principales |
| Text secondary | `#64748B` | Labels de soporte |
| Text tertiary | `#94A3B8` | Metadata, placeholders |
| Text muted | `#CBD5E1` | Disabled, vacío |
| Border standard | `#F1F5F9` | Separadores entre filas/secciones |
| Border soft | `#F8FAFC` | Separadores muy sutiles (tbody rows) |

---

## Typography

- **Números / datos / patentes / tickets:** `JetBrains Mono, monospace` — siempre. Da el look de display digital / ticket impreso.
- **Hero counter:** 88px, weight 800, color ámbar, `letter-spacing: -0.02em`
- **KPI numbers (secundarios):** 44px, weight 800
- **Labels de sección:** 11px, weight 700, `letter-spacing: 0.15-0.2em`, uppercase, color `#94A3B8`
- **Body / filas de tabla:** 13px, weight normal
- **Badges:** 11px, weight 600, `border-radius: 9999px`

---

## Depth Strategy

**Subtle shadows** — una sola capa, nunca dramática:
```css
box-shadow: 0 1px 4px rgba(0,0,0,0.06)
```

Nunca mezclar con borders fuertes. Los borders de separación son `#F1F5F9` (suaves) o `#F8FAFC` (ultra-suaves entre filas).

---

## Spacing

Base: **4px**. Escala: 4, 8, 12, 16, 20, 24, 28, 32, 40.

- Gap entre secciones de página: `gap-5` (20px)
- Padding interno de cards: `p-5` (20px)
- Padding de hero card: `p-7` (28px)
- Gap entre KPI grid: `gap-4` (16px)
- Padding de filas de tabla: `px-4 py-3.5` o `px-5 py-3.5`

---

## Border Radius

- Cards / panels: `rounded-2xl` (16px)
- Badges: `rounded-full`
- Icon containers pequeños: `rounded-lg` (8px) o `rounded-xl` (12px)
- Inputs / selects: `rounded-md` (6px)

---

## Layout Patterns

### Dashboard hero (2/3 + 1/3)
```tsx
<div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
  <HeroCounterCard />   // dark, contador gigante
  <ShiftStatusCard />   // blanca, info de turno
</div>
```

### KPI row (3 columnas iguales)
```tsx
<div className="grid grid-cols-3 gap-4">
  <KpiCard />
  <KpiCard />
  <KpiCard />
</div>
```

### KPI card structure
```tsx
<div className="rounded-2xl p-5 bg-white flex flex-col gap-3"
     style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
  <div className="flex items-center justify-between">
    <p className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#94A3B8' }}>
      LABEL
    </p>
    <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: BG }}>
      <Icon size={13} style={{ color: COLOR }} />
    </div>
  </div>
  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 44, fontWeight: 800, color: '#0F1723', lineHeight: 1 }}>
    {value}
  </p>
  <p className="text-[12px]" style={{ color: '#94A3B8' }}>sublabel</p>
</div>
```

### Table / activity list
```tsx
<div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4"
       style={{ borderBottom: '1px solid #F1F5F9' }}>
    <p className="text-[14px] font-semibold" style={{ color: '#0F1723' }}>Título</p>
  </div>
  {/* Rows */}
  {items.map((item, i) => (
    <div key={item.id}
         className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
         style={{ borderTop: i > 0 ? '1px solid #F8FAFC' : undefined }}>
      {/* content */}
    </div>
  ))}
</div>
```

### Full-width table (con <table>)
```tsx
<div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
  <table className="w-full">
    <thead>
      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
        <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: '#94A3B8' }}>Col</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={row.id}
            style={{ borderTop: i > 0 ? '1px solid #F8FAFC' : undefined }}
            className="hover:bg-slate-50 transition-colors">
          <td className="px-4 py-3 text-[13px]" style={{ color: '#374151' }}>{row.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Status Badges

```tsx
// Activo / vigente
<span style={{ background: 'rgba(34,197,94,0.12)', color: '#16A34A' }}>● ABIERTO</span>

// Inactivo / cerrado
<span style={{ background: '#F1F5F9', color: '#94A3B8' }}>Inactivo</span>

// Error / vencido
<span style={{ background: '#FEF2F2', color: '#DC2626' }}>Vencido</span>

// En proceso / ámbar
<span style={{ background: '#FFFBEB', color: '#D97706' }}>En curso</span>
```

---

## Hero Card (dark) — Signature Element

```tsx
<div className="rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden"
     style={{ background: '#0F1723', minHeight: 196 }}>
  {/* Grid overlay — garage floor lines */}
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px),' +
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px)',
  }} />
  <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>
    LABEL EN MAYÚSCULAS
  </p>
  {/* Counter */}
  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 88, fontWeight: 800,
              color: '#F59E0B', lineHeight: 1, letterSpacing: '-0.02em' }}>
    {pad2(value)}
  </p>
</div>
```

---

## Page Header Pattern

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#0F1723' }}>
      Título de página
    </h1>
    <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Descripción breve</p>
  </div>
  <Button className="gap-2 font-semibold" style={{ background: ACCENT_COLOR }}>
    <Icon size={15} /> Acción principal
  </Button>
</div>
```

---

## Icon Containers

```tsx
// Pequeño (KPI row)
<div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: BG }}>
  <Icon size={13} style={{ color: COLOR }} />
</div>

// Mediano (cards, headers)
<div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: BG }}>
  <Icon size={16} style={{ color: COLOR }} />
</div>

// Grande (estados vacíos)
<div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: BG }}>
  <Icon size={22} style={{ color: COLOR }} />
</div>
```

---

## Color por módulo

| Módulo | Accent | BG suave |
|--------|--------|----------|
| Estacionamiento | `#3B82F6` | `#EFF6FF` |
| Vehículos | `#3B82F6` | `#EFF6FF` |
| Tarifas | `#F59E0B` | `#FFFBEB` |
| Turnos | `#22C55E` | `#F0FDF4` |
| Abonos | `#0891B2` | `#ECFEFF` |
| Usuarios | `#7C3AED` | `#F5F3FF` |
| Auditoría | `#64748B` | `#F1F5F9` |
