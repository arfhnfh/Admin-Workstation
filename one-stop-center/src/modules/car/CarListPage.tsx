import { useEffect, useMemo, useState } from 'react'
import { Car, CarFront, Gauge, Search, ShieldCheck } from 'lucide-react'
import {
  fetchCars,
  type CarSummary,
  type CarUpsertInput,
  createCar,
  updateCar,
  type CarStatus,
} from '@/services/carService'

export default function CarListPage() {
  const [cars, setCars] = useState<CarSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<CarSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | CarStatus>('ALL')
  const [brandFilter, setBrandFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchCars()
      setCars(data)
      setLoading(false)
    }
    load()
  }, [])

  const brandOptions = useMemo(() => {
    const set = new Set<string>()
    cars.forEach((c) => {
      if (c.core.brand) set.add(c.core.brand)
    })
    return Array.from(set).sort()
  }, [cars])

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    cars.forEach((c) => {
      if (c.core.vehicleType) set.add(c.core.vehicleType)
    })
    return Array.from(set).sort()
  }, [cars])

  const filtered = cars.filter((c) => {
    const text = `${c.core.plateNumber} ${c.core.brand} ${c.core.model} ${c.core.variant ?? ''}`.toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' ? true : c.core.status === statusFilter
    const matchesBrand = brandFilter === 'ALL' ? true : c.core.brand === brandFilter
    const matchesType = typeFilter === 'ALL' ? true : c.core.vehicleType === typeFilter
    return matchesQuery && matchesStatus && matchesBrand && matchesType
  })

  const brandImage = (brand: string) => {
    const b = brand.toLowerCase()
    // Use brand-specific placeholder text when known; otherwise null to show icon
    if (b.includes('toyota')) return 'toyota'
    if (b.includes('honda')) return 'honda'
    if (b.includes('perodua')) return 'perodua'
    if (b.includes('proton')) return 'proton'
    if (b.includes('mazda')) return 'mazda'
    if (b.includes('nissan')) return 'nissan'
    return null
  }

  const handleAdd = () => {
    setEditing(null)
    setDrawerOpen(true)
  }

  const handleEdit = (car: CarSummary) => {
    setEditing(car)
    setDrawerOpen(true)
  }

  const handleSave = async (input: CarUpsertInput, id?: string) => {
    setSaving(true)
    setError(null)
    const res = id ? await updateCar(id, input) : await createCar(input)
    if (res.error) {
      setError(res.error.message)
      setSaving(false)
      return
    }
    const refreshed = await fetchCars()
    setCars(refreshed)
    setSaving(false)
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
            <button
              onClick={handleAdd}
              className="rounded-xl border border-brand.violet bg-brand.violet px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand.violet/90"
            >
              + Add Vehicle
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'ALL' | CarStatus)}
            options={['ALL', 'ACTIVE', 'INACTIVE', 'DISPOSED']}
          />
          <FilterSelect label="Brand" value={brandFilter} onChange={setBrandFilter} options={['ALL', ...brandOptions]} />
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={['ALL', ...typeOptions]} />
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('ALL')
                setBrandFilter('ALL')
                setTypeFilter('ALL')
              }}
              className="w-full rounded-xl border border-card-border bg-white px-3 py-2 text-sm font-semibold text-charcoal shadow-sm transition hover:bg-brand.sand/40"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white/60 p-6 text-center text-text-muted shadow-md backdrop-blur-md">
            Loading cars...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/60 p-6 text-center text-text-muted shadow-md backdrop-blur-md">
            No vehicles found.
          </div>
        ) : (
          filtered.map((car) => (
            <div
              key={car.core.id}
              className="rounded-3xl border border-white/60 bg-white/60 p-5 shadow-lg backdrop-blur-md transition hover:shadow-xl"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-card-border">
                    {brandImage(car.core.brand) ? (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
                        {brandImage(car.core.brand)?.toUpperCase()}
                      </div>
                    ) : (
                      <Car className="h-8 w-8 text-brand.violet" />
                    )}
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
                <button
                  onClick={() => handleEdit(car)}
                  className="rounded-lg bg-brand.violet/10 px-3 py-2 text-xs font-semibold text-brand.violet hover:bg-brand.violet/20"
                >
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

      <CarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        saving={saving}
        error={error}
        car={editing}
      />
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

type DrawerProps = {
  open: boolean
  onClose: () => void
  onSave: (input: CarUpsertInput, id?: string) => void
  saving: boolean
  error: string | null
  car: CarSummary | null
}

function CarDrawer({ open, onClose, onSave, saving, error, car }: DrawerProps) {
  const inputClass =
    'w-full rounded-xl border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none shadow-sm'
  const selectClass = inputClass

  const [core, setCore] = useState<CarUpsertInput['core']>({
    vehicleId: '',
    plateNumber: '',
    vehicleType: 'Car',
    brand: '',
    model: '',
    variant: '',
    year: undefined,
    engineCapacity: undefined,
    fuel: '',
    chassisNo: '',
    engineNo: '',
    status: 'ACTIVE' as CarStatus,
  })
  const [ownership, setOwnership] = useState<CarUpsertInput['ownership']>({})
  const [insurance, setInsurance] = useState<CarUpsertInput['insurance']>({})
  const [roadtax, setRoadtax] = useState<CarUpsertInput['roadtax']>({})

  useEffect(() => {
    if (car) {
      setCore({
        vehicleId: car.core.vehicleId,
        plateNumber: car.core.plateNumber,
        vehicleType: car.core.vehicleType,
        brand: car.core.brand,
        model: car.core.model,
        variant: car.core.variant || '',
        year: car.core.year || undefined,
        engineCapacity: car.core.engineCapacity || undefined,
        fuel: car.core.fuel || '',
        chassisNo: car.core.chassisNo || '',
        engineNo: car.core.engineNo || '',
        status: car.core.status,
      })
      setOwnership({
        registeredOwner: car.ownership?.registeredOwner || '',
        subsidiary: car.ownership?.subsidiary || '',
        registrationDate: car.ownership?.registrationDate || '',
        ownershipType: car.ownership?.ownershipType || '',
        financier: car.ownership?.financier || '',
        hpEndDate: car.ownership?.hpEndDate || '',
      })
      setInsurance({
        insurer: car.insurance?.insurer || '',
        broker: car.insurance?.broker || '',
        policyNo: car.insurance?.policyNo || '',
        coverage: car.insurance?.coverage || '',
        coverageStart: car.insurance?.coverageStart || '',
        coverageEnd: car.insurance?.coverageEnd || '',
        sumInsured: car.insurance?.sumInsured || undefined,
        premium: car.insurance?.premium || undefined,
        ncd: car.insurance?.ncd || undefined,
        windscreen: car.insurance?.windscreen || false,
        endorsement: car.insurance?.endorsement || '',
      })
      setRoadtax({
        periodStart: car.roadtax?.periodStart || '',
        periodEnd: car.roadtax?.periodEnd || '',
        amount: car.roadtax?.amount || undefined,
        roadtaxType: car.roadtax?.roadtaxType || '',
      })
    } else {
      setCore({
        vehicleId: '',
        plateNumber: '',
        vehicleType: 'Car',
        brand: '',
        model: '',
        variant: '',
        year: undefined,
        engineCapacity: undefined,
        fuel: '',
        chassisNo: '',
        engineNo: '',
        status: 'ACTIVE',
      })
      setOwnership({})
      setInsurance({})
      setRoadtax({})
    }
  }, [car])

  const handleSubmit = () => {
    onSave(
      {
        core,
        ownership,
        insurance,
        roadtax,
      },
      car?.core.id
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-screen w-full max-w-3xl overflow-y-auto border border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">{car ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
            <p className="text-sm text-text-muted">Core details, ownership, insurance, and road tax.</p>
          </div>
          <button onClick={onClose} className="text-sm text-text-muted hover:text-charcoal">
            Close
          </button>
        </div>

        {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        <div className="mt-2 space-y-4">
          {/* Core */}
          <Section title="Vehicle">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Vehicle ID" required>
                <input className={inputClass} value={core.vehicleId} onChange={(e) => setCore({ ...core, vehicleId: e.target.value })} />
              </Field>
              <Field label="Plate Number" required>
                <input
                  className={inputClass}
                  value={core.plateNumber}
                  onChange={(e) => setCore({ ...core, plateNumber: e.target.value })}
                />
              </Field>
              <Field label="Type" required>
                <input className={inputClass} value={core.vehicleType} onChange={(e) => setCore({ ...core, vehicleType: e.target.value })} />
              </Field>
              <Field label="Brand" required>
                <input className={inputClass} value={core.brand} onChange={(e) => setCore({ ...core, brand: e.target.value })} />
              </Field>
              <Field label="Model" required>
                <input className={inputClass} value={core.model} onChange={(e) => setCore({ ...core, model: e.target.value })} />
              </Field>
              <Field label="Variant">
                <input className={inputClass} value={core.variant ?? ''} onChange={(e) => setCore({ ...core, variant: e.target.value })} />
              </Field>
              <Field label="Year">
                <input
                  className={inputClass}
                  type="number"
                  value={core.year ?? ''}
                  onChange={(e) => setCore({ ...core, year: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Engine Capacity (cc)">
                <input
                  className={inputClass}
                  type="number"
                  value={core.engineCapacity ?? ''}
                  onChange={(e) => setCore({ ...core, engineCapacity: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Fuel">
                <input className={inputClass} value={core.fuel ?? ''} onChange={(e) => setCore({ ...core, fuel: e.target.value })} />
              </Field>
              <Field label="Chassis No">
                <input className={inputClass} value={core.chassisNo ?? ''} onChange={(e) => setCore({ ...core, chassisNo: e.target.value })} />
              </Field>
              <Field label="Engine No">
                <input className={inputClass} value={core.engineNo ?? ''} onChange={(e) => setCore({ ...core, engineNo: e.target.value })} />
              </Field>
              <Field label="Status">
                <select
                  className={selectClass}
                  value={core.status}
                  onChange={(e) => setCore({ ...core, status: e.target.value as CarStatus })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DISPOSED">DISPOSED</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Ownership */}
          <Section title="Ownership & Registration">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Registered Owner">
                <input
                  className={inputClass}
                  value={ownership?.registeredOwner ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, registeredOwner: e.target.value })}
                />
              </Field>
              <Field label="Subsidiary">
                <input
                  className={inputClass}
                  value={ownership?.subsidiary ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, subsidiary: e.target.value })}
                />
              </Field>
              <Field label="Registration Date">
                <input
                  className={inputClass}
                  type="date"
                  value={ownership?.registrationDate ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, registrationDate: e.target.value })}
                />
              </Field>
              <Field label="Ownership Type">
                <input
                  className={inputClass}
                  value={ownership?.ownershipType ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, ownershipType: e.target.value })}
                />
              </Field>
              <Field label="Financier">
                <input
                  className={inputClass}
                  value={ownership?.financier ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, financier: e.target.value })}
                />
              </Field>
              <Field label="HP End Date">
                <input
                  className={inputClass}
                  type="date"
                  value={ownership?.hpEndDate ?? ''}
                  onChange={(e) => setOwnership({ ...ownership, hpEndDate: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          {/* Insurance */}
          <Section title="Insurance (Current)">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Insurer">
                <input
                  className={inputClass}
                  value={insurance?.insurer ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, insurer: e.target.value })}
                />
              </Field>
              <Field label="Broker">
                <input
                  className={inputClass}
                  value={insurance?.broker ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, broker: e.target.value })}
                />
              </Field>
              <Field label="Policy No">
                <input
                  className={inputClass}
                  value={insurance?.policyNo ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, policyNo: e.target.value })}
                />
              </Field>
              <Field label="Coverage">
                <input
                  className={inputClass}
                  value={insurance?.coverage ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, coverage: e.target.value })}
                />
              </Field>
              <Field label="Coverage Start">
                <input
                  className={inputClass}
                  type="date"
                  value={insurance?.coverageStart ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, coverageStart: e.target.value })}
                />
              </Field>
              <Field label="Coverage End">
                <input
                  className={inputClass}
                  type="date"
                  value={insurance?.coverageEnd ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, coverageEnd: e.target.value })}
                />
              </Field>
              <Field label="Sum Insured (RM)">
                <input
                  className={inputClass}
                  type="number"
                  value={insurance?.sumInsured ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, sumInsured: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Premium (RM)">
                <input
                  className={inputClass}
                  type="number"
                  value={insurance?.premium ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, premium: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="NCD (%)">
                <input
                  className={inputClass}
                  type="number"
                  value={insurance?.ncd ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, ncd: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Windscreen">
                <select
                  className={selectClass}
                  value={insurance?.windscreen ? 'YES' : 'NO'}
                  onChange={(e) => setInsurance({ ...insurance, windscreen: e.target.value === 'YES' })}
                >
                  <option value="NO">No</option>
                  <option value="YES">Yes</option>
                </select>
              </Field>
              <Field label="Endorsement">
                <input
                  className="input"
                  value={insurance?.endorsement ?? ''}
                  onChange={(e) => setInsurance({ ...insurance, endorsement: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          {/* Road Tax */}
          <Section title="Road Tax">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Period Start">
                <input
                  className={inputClass}
                  type="date"
                  value={roadtax?.periodStart ?? ''}
                  onChange={(e) => setRoadtax({ ...roadtax, periodStart: e.target.value })}
                />
              </Field>
              <Field label="Period End">
                <input
                  className={inputClass}
                  type="date"
                  value={roadtax?.periodEnd ?? ''}
                  onChange={(e) => setRoadtax({ ...roadtax, periodEnd: e.target.value })}
                />
              </Field>
              <Field label="Amount (RM)">
                <input
                  className={inputClass}
                  type="number"
                  value={roadtax?.amount ?? ''}
                  onChange={(e) => setRoadtax({ ...roadtax, amount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
              <Field label="Road Tax Type">
                <input
                  className={inputClass}
                  value={roadtax?.roadtaxType ?? ''}
                  onChange={(e) => setRoadtax({ ...roadtax, roadtaxType: e.target.value })}
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-card-border bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-sm transition hover:bg-brand.sand/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl border border-brand.violet bg-brand.violet px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand.violet/90 focus:ring-2 focus:ring-brand.violet/30 disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-card-border bg-white/80 p-4 shadow-card">
      <h4 className="mb-3 text-sm font-semibold text-charcoal">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-charcoal">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="space-y-1 text-sm text-charcoal">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <select
        className="w-full rounded-xl border border-card-border bg-white px-3 py-2 text-sm focus:border-brand.violet focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}

