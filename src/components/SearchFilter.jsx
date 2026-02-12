import { Search, X, Filter } from 'lucide-react'

export default function SearchFilter({ searchValue, onSearchChange, searchPlaceholder = 'Search...', filters = [], children }) {
    return (
        <div className="card mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-10 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-muted"
                    />
                    {searchValue && (
                        <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filter dropdowns */}
                {filters.map((f) => (
                    <select
                        key={f.key}
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text min-w-[140px]"
                    >
                        <option value="">{f.label}</option>
                        {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ))}

                {children}
            </div>
        </div>
    )
}
