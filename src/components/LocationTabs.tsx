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
    <div className="heaton-tabs">
      <button
        onClick={() => onLocationChange('All')}
        className={`heaton-tab ${selectedLocation === 'All' ? 'heaton-tab--active' : ''}`}
      >
        All<span className="heaton-tab-count">{totalCount}</span>
      </button>

      {locations.map((location) => (
        <button
          key={location}
          onClick={() => onLocationChange(location)}
          className={`heaton-tab ${selectedLocation === location ? 'heaton-tab--active' : ''}`}
        >
          {location}<span className="heaton-tab-count">{employeeCounts[location] || 0}</span>
        </button>
      ))}
    </div>
  )
}
