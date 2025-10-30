'use client'

import { useState, useMemo } from 'react'
import { Employee } from '@/types/employee'
import LocationTabs from './LocationTabs'
import ExportMenu from './ExportMenu'

interface AppleDirectoryViewProps {
  employees: Employee[]
}

export default function AppleDirectoryView({ employees }: AppleDirectoryViewProps) {
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique locations and employee counts
  const { locations, employeeCounts } = useMemo(() => {
    const locationSet = new Set<string>()
    const counts: Record<string, number> = {}

    employees.forEach(emp => {
      if (emp.location) {
        locationSet.add(emp.location)
        counts[emp.location] = (counts[emp.location] || 0) + 1
      }
    })

    return {
      locations: Array.from(locationSet).sort(),
      employeeCounts: counts
    }
  }, [employees])

  // Filter and group employees
  const { groupedEmployees, filteredEmployees } = useMemo(() => {
    // Filter by selected location
    const locationFiltered = selectedLocation === 'All'
      ? employees
      : employees.filter(emp => emp.location === selectedLocation)

    // Filter by search term
    const searchFiltered = searchTerm
      ? locationFiltered.filter(emp => {
          const searchText = `${emp.firstName} ${emp.lastName} ${emp.title || ''} ${emp.team || ''} ${emp.location || ''}`.toLowerCase()
          return searchText.includes(searchTerm.toLowerCase())
        })
      : locationFiltered

    // Group by location
    const grouped: Record<string, Employee[]> = {}
    searchFiltered.forEach(emp => {
      if (!grouped[emp.location]) {
        grouped[emp.location] = []
      }
      grouped[emp.location].push(emp)
    })

    // Sort employees within each group
    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
    })

    return {
      groupedEmployees: grouped,
      filteredEmployees: searchFiltered
    }
  }, [employees, selectedLocation, searchTerm])

  const totalFilteredCount = filteredEmployees.length

  const getInitials = (employee: Employee) => {
    const firstInitial = employee.firstName?.[0] || ''
    const lastInitial = employee.lastName?.[0] || ''
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  return (
    <div className="directory-container">
      {/* Header */}
      <header className="directory-header">
        <div className="header-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 className="header-title" style={{ margin: 0 }}>Heaton Eye Associates</h1>
              <p className="header-subtitle">Employee Directory</p>
            </div>
            <ExportMenu
              employees={filteredEmployees}
              selectedLocation={selectedLocation}
            />
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-wrapper">
              {/* Search Icon */}
              <svg
                className="search-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              {/* Search Input */}
              <input
                id="employee-search"
                type="text"
                className="search-input"
                placeholder="Search by name, title, or team..."
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Clear Button */}
              {searchTerm && (
                <button
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  style={{ opacity: 1 }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Results Count */}
            <div style={{ marginTop: '12px' }}>
              <p className="text-sm text-secondary">
                Showing {totalFilteredCount} of {employees.length} employees
              </p>
            </div>
          </div>

          {/* Location Tabs */}
          <LocationTabs
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            employeeCounts={employeeCounts}
            totalCount={employees.length}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="directory-main">
        {Object.keys(groupedEmployees).length === 0 ? (
          <div className="empty-state">
            <svg
              className="empty-state-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="empty-state-title">No employees found</h3>
            <p className="empty-state-description">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div>
            {locations
              .filter(location => groupedEmployees[location])
              .map((location) => (
                <div key={location} style={{ marginBottom: '48px' }}>
                  {/* Location Header (only show if All is selected) */}
                  {selectedLocation === 'All' && (
                    <div style={{ marginBottom: '24px' }}>
                      <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'var(--primary-text-color)',
                        margin: '0 0 8px 0',
                        fontFamily: 'var(--font-family-heading)'
                      }}>
                        {location}
                      </h2>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--secondary-text-color)',
                        margin: 0
                      }}>
                        {groupedEmployees[location].length} {groupedEmployees[location].length === 1 ? 'employee' : 'employees'}
                      </p>
                    </div>
                  )}

                  {/* Employee Grid */}
                  <div className="employee-grid">
                    {groupedEmployees[location].map((employee) => (
                      <div key={employee.id} className="employee-card">
                        {/* Avatar */}
                        {employee.photoUrl ? (
                          <img
                            src={employee.photoUrl}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="employee-avatar"
                          />
                        ) : (
                          <div className="employee-avatar-placeholder">
                            {getInitials(employee)}
                          </div>
                        )}

                        {/* Employee Info */}
                        <div className="employee-info">
                          <h3 className="employee-name">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          {employee.title && (
                            <p className="employee-title">{employee.title}</p>
                          )}
                          {employee.team && (
                            <p className="employee-department">{employee.team}</p>
                          )}
                        </div>

                        {/* Contact Details */}
                        {(employee.email || employee.extension || employee.location) && (
                          <div className="employee-details">
                            {employee.email && (
                              <div className="employee-detail-item">
                                <svg className="employee-detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="employee-email">{employee.email}</span>
                              </div>
                            )}
                            {employee.extension && (
                              <div className="employee-detail-item">
                                <svg className="employee-detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>Ext. {employee.extension}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
