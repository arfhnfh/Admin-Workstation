import { useEffect, useState } from 'react'
import { Car, CarFront, Fuel, Gauge, Search, ShieldCheck, Wallet, Wrench } from 'lucide-react'
import { fetchCars, type CarSummary } from '@/services/carService'

export default function CarListPage() {
  const [cars, setCars] = useState<CarSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchCars()
      setCars(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = cars.filter((c) => {
    const text = `${c.core.plateNumber} ${c.core.brand} ${c.core.model} ${c.core.variant ?? ''}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-card">
        <div>
          <p className="text-sm text-text-muted">Admin / Fleet</p>
          <h1 className="mt-1 text-2xl font-semibold text-charcoal">Car Master</h1>
          <p className="text-sm text-text-muted">Manage company vehicles, insurance, and road tax.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plate, brand, model..."
              className="w-64 rounded-2xl border border-card-border bg-white px-9 py-2.5 text-sm focus:border-brand.violet focus:outline-none"
            />
          </div>
          <button className="rounded-xl bg-brand.violet px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand.violet/90">
            + Add Vehicle
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 text-center text-text-muted">Loading cars...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-card-border bg-white/80 p-6 text-center text-text-muted">No vehicles found.</div>
        ) : (
          filtered.map((car) => (
            <div
              key={car.core.id}
              className="rounded-3xl border border-card-border bg-white/80 p-5 shadow-card transition hover:shadow-lg"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand.violet/10 text-brand.violet">
                    <Car className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-charcoal">
                        {car.core.plateNumber} · {car.core.brand} {car.core.model}
                      </p>
                      {car.core.variant && <span className="text-sm text-text-muted">{car.core.variant}</span>}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          car.core.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : car.core.status === 'DISPOSED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {car.core.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">
                      ID {car.core.vehicleId} · {car.core.vehicleType} · {car.core.year || 'Year ?'} · {car.core.fuel || 'Fuel ?'} ·{' '}
                      {car.core.engineCapacity ? `${car.core.engineCapacity} cc` : 'Engine ?'}
                    </p>
                    <p className="text-xs text-text-muted">
                      Chassis: {car.core.chassisNo || '-'} · Engine: {car.core.engineNo || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <InfoCard
                    title="Ownership"
                    icon={<CarFront className="h-4 w-4" />}
                    lines={[
                      car.ownership?.registeredOwner || 'Owner ?',
                      car.ownership?.subsidiary || 'Subsidiary ?',
                      car.ownership?.ownershipType || 'Type ?',
                    ]}
                  />
                  <InfoCard
                    title="Insurance"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    lines={[
                      car.insurance?.policyNo ? `Policy: ${car.insurance.policyNo}` : 'Policy ?',
                      car.insurance?.insurer || 'Insurer ?',
                      car.insurance?.coverage && car.insurance?.coverageStart && car.insurance?.coverageEnd
                        ? `${car.insurance.coverage} (${car.insurance.coverageStart} → ${car.insurance.coverageEnd})`
                        : 'Coverage dates ?',
                    ]}
                    pill={
                      car.insurance?.sumInsured
                        ? { label: `Sum Insured RM ${car.insurance.sumInsured}`, tone: 'blue' }
                        : undefined
                    }
                  />
                  <InfoCard
                    title="Road Tax"
                    icon={<Gauge className="h-4 w-4" />}
                    lines={[
                      car.roadtax?.periodStart && car.roadtax?.periodEnd
                        ? `${car.roadtax.periodStart} → ${car.roadtax.periodEnd}`
                        : 'Period ?',
                      car.roadtax?.roadtaxType || 'Type ?',
                      car.roadtax?.amount ? `RM ${car.roadtax.amount}` : 'Amount ?',
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="rounded-lg bg-brand.violet/10 px-3 py-2 text-xs font-semibold text-brand.violet hover:bg-brand.violet/20">
                  View / Edit
                </button>
                <button className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  Insurance History
                </button>
                <button className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  Road Tax
                </button>
                <button className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                  Disable
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function InfoCard({
  title,
  icon,
  lines,
  pill,
}: {
  title: string
  icon: React.ReactNode
  lines: (string | null | undefined)[]
  pill?: { label: string; tone: 'blue' | 'green' | 'amber' }
}) {
  const tone =
    pill?.tone === 'green'
      ? 'bg-emerald-100 text-emerald-700'
      : pill?.tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700'

  return (
    <div className="rounded-2xl border border-card-border bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal">
        {icon}
        {title}
      </div>
      <div className="space-y-1">
        {lines.map((line, idx) => (
          <p key={idx} className="text-xs text-text-muted">
            {line || '-'}
          </p>
        ))}
      </div>
      {pill && <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{pill.label}</span>}
    </div>
  )
}

