'use client'

interface LocationTabsProps {
  locations: string[]
  selectedLocation: string
  onLocationChange: (location: string) => void
  employeeCounts: Record<string, number>
  totalCount: number
}

export default function LocationTabs({
  locations,
  selectedLocation,
  onLocationChange,
  employeeCounts,
  totalCount
}: LocationTabsProps) {
  return (
    <div style={{
      borderBottom: '1px solid var(--border-color)',
      marginTop: '24px',
      overflowX: 'auto'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        minWidth: 'min-content'
      }}>
        {/* All Locations Tab */}
        <button
          onClick={() => onLocationChange('All')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: selectedLocation === 'All' ? '600' : '500',
            color: selectedLocation === 'All' ? 'var(--accent-color)' : 'var(--secondary-text-color)',
            borderBottom: selectedLocation === 'All' ? '3px solid var(--accent-color)' : '3px solid transparent',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            marginBottom: '-1px'
          }}
          onMouseEnter={(e) => {
            if (selectedLocation !== 'All') {
              e.currentTarget.style.color = 'var(--primary-text-color)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedLocation !== 'All') {
              e.currentTarget.style.color = 'var(--secondary-text-color)'
            }
          }}
        >
          All ({totalCount})
        </button>

        {/* Individual Location Tabs */}
        {locations.map((location) => (
          <button
            key={location}
            onClick={() => onLocationChange(location)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: selectedLocation === location ? '600' : '500',
              color: selectedLocation === location ? 'var(--accent-color)' : 'var(--secondary-text-color)',
              borderBottom: selectedLocation === location ? '3px solid var(--accent-color)' : '3px solid transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              marginBottom: '-1px'
            }}
            onMouseEnter={(e) => {
              if (selectedLocation !== location) {
                e.currentTarget.style.color = 'var(--primary-text-color)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLocation !== location) {
                e.currentTarget.style.color = 'var(--secondary-text-color)'
              }
            }}
          >
            {location} ({employeeCounts[location] || 0})
          </button>
        ))}
      </div>
    </div>
  )
}
