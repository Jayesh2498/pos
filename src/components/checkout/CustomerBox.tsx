import { useState } from 'react'
import { Search, X, AlertCircle, ChevronDown } from 'lucide-react'
import type { CustomerLookup } from '@/types/pos'

interface Props {
  name: string
  onNameChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  onLookup: (phone: string) => void
  customer: CustomerLookup | null
  state: 'idle' | 'found' | 'new'
  onClear: () => void
}

interface CountryDef {
  code: string
  dialCode: string
  flag: string
  name: string
  minDigits: number
  maxDigits: number
}

const COUNTRIES: CountryDef[] = [
  { code: 'IN', dialCode: '+91',  flag: '🇮🇳', name: 'India',        minDigits: 10, maxDigits: 10 },
  { code: 'US', dialCode: '+1',   flag: '🇺🇸', name: 'USA',          minDigits: 10, maxDigits: 10 },
  { code: 'GB', dialCode: '+44',  flag: '🇬🇧', name: 'UK',           minDigits: 10, maxDigits: 10 },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', name: 'UAE',          minDigits: 9,  maxDigits: 9  },
  { code: 'SG', dialCode: '+65',  flag: '🇸🇬', name: 'Singapore',    minDigits: 8,  maxDigits: 8  },
  { code: 'AU', dialCode: '+61',  flag: '🇦🇺', name: 'Australia',    minDigits: 9,  maxDigits: 9  },
  { code: 'CA', dialCode: '+1',   flag: '🇨🇦', name: 'Canada',       minDigits: 10, maxDigits: 10 },
  { code: 'DE', dialCode: '+49',  flag: '🇩🇪', name: 'Germany',      minDigits: 10, maxDigits: 11 },
  { code: 'FR', dialCode: '+33',  flag: '🇫🇷', name: 'France',       minDigits: 9,  maxDigits: 9  },
  { code: 'JP', dialCode: '+81',  flag: '🇯🇵', name: 'Japan',        minDigits: 10, maxDigits: 10 },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', name: 'Saudi Arabia', minDigits: 9,  maxDigits: 9  },
  { code: 'MY', dialCode: '+60',  flag: '🇲🇾', name: 'Malaysia',     minDigits: 9,  maxDigits: 10 },
  { code: 'PH', dialCode: '+63',  flag: '🇵🇭', name: 'Philippines',  minDigits: 10, maxDigits: 10 },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩', name: 'Bangladesh',   minDigits: 10, maxDigits: 10 },
  { code: 'PK', dialCode: '+92',  flag: '🇵🇰', name: 'Pakistan',     minDigits: 10, maxDigits: 10 },
  { code: 'NP', dialCode: '+977', flag: '🇳🇵', name: 'Nepal',        minDigits: 10, maxDigits: 10 },
  { code: 'LK', dialCode: '+94',  flag: '🇱🇰', name: 'Sri Lanka',    minDigits: 9,  maxDigits: 9  },
]

function validatePhone(digits: string, country: CountryDef): string | null {
  if (!digits) return null
  if (digits.length < country.minDigits) return `Must be at least ${country.minDigits} digits for ${country.name}`
  if (digits.length > country.maxDigits) return `Must be at most ${country.maxDigits} digits for ${country.name}`
  return null
}

export default function CustomerBox({
  name, onNameChange, phone, onPhoneChange, onLookup, customer, state, onClear,
}: Props) {
  const [country, setCountry] = useState<CountryDef>(COUNTRIES[0])
  const [showCountries, setShowCountries] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  const digits = phone.replace(/\D/g, '')

  function handleLookup() {
    if (digits) {
      const err = validatePhone(digits, country)
      if (err) { setPhoneError(err); return }
    }
    setPhoneError('')
    const fullPhone = digits ? `${country.dialCode} ${phone.trim()}` : ''
    onLookup(fullPhone || phone)
  }

  function handlePhoneChange(v: string) {
    onPhoneChange(v)
    if (phoneError) {
      const d = v.replace(/\D/g, '')
      if (!validatePhone(d, country)) setPhoneError('')
    }
  }

  function handlePhoneBlur() {
    if (digits) {
      const err = validatePhone(digits, country)
      setPhoneError(err ?? '')
    } else {
      setPhoneError('')
    }
  }

  function selectCountry(c: CountryDef) {
    setCountry(c)
    setShowCountries(false)
    setPhoneError('')
  }

  return (
    <div className="cust-box">
      <p className="cust-box-title">Customer</p>

      {/* Phone row with country picker */}
      <div className="cust-box-row" style={{ position: 'relative' }}>
        {/* Country picker trigger */}
        <button
          type="button"
          className="cust-country-btn"
          onClick={() => setShowCountries(v => !v)}
        >
          <span className="cust-country-flag">{country.flag}</span>
          <span className="cust-country-dial">{country.dialCode}</span>
          <ChevronDown size={10} />
        </button>

        {/* Country dropdown */}
        {showCountries && (
          <div className="cust-country-dropdown">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                type="button"
                className={`cust-country-opt ${c.code === country.code ? 'cust-country-opt--active' : ''}`}
                onClick={() => selectCountry(c)}
              >
                <span>{c.flag}</span>
                <span className="cust-country-opt-name">{c.name}</span>
                <span className="cust-country-opt-dial">{c.dialCode}</span>
              </button>
            ))}
          </div>
        )}

        <input
          className={`cust-box-input ${phoneError ? 'cust-box-input--error' : ''}`}
          placeholder="Phone number"
          value={phone}
          onChange={e => handlePhoneChange(e.target.value)}
          onBlur={handlePhoneBlur}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          type="tel"
          inputMode="tel"
        />
        <button className="cust-box-lookup-btn" onClick={handleLookup} type="button">
          <Search size={13} />
        </button>
        {(phone || name) && (
          <button className="cust-box-clear-btn" onClick={() => { onClear(); setPhoneError('') }} type="button">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Phone validation error */}
      {phoneError && (
        <div className="cust-box-error">
          <AlertCircle size={11} />
          {phoneError}
        </div>
      )}

      {/* Name row */}
      <div className="cust-box-row">
        <input
          className="cust-box-input"
          placeholder="Customer name (optional)"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      {/* Status */}
      {state === 'found' && customer && (
        <div className="cust-box-found">
          <div>
            <p className="cust-box-found-name">{customer.name}</p>
            <p className="cust-box-found-meta">
              {customer.total_orders} orders · spent {customer.total_spent.toFixed(2)}
            </p>
          </div>
          <span style={{ fontSize: 16, color: '#16A34A' }}>✓</span>
        </div>
      )}
      {state === 'new' && (
        <div className="cust-box-new">
          New customer — will be created on checkout
        </div>
      )}
    </div>
  )
}
