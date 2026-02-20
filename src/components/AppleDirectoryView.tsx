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

  const { groupedEmployees, filteredEmployees } = useMemo(() => {
    const locationFiltered = selectedLocation === 'All'
      ? employees
      : employees.filter(emp => emp.location === selectedLocation)

    const searchFiltered = searchTerm
      ? locationFiltered.filter(emp => {
          const searchText = `${emp.firstName} ${emp.lastName} ${emp.title || ''} ${emp.team || ''} ${emp.location || ''} ${emp.email || ''}`.toLowerCase()
          return searchText.includes(searchTerm.toLowerCase())
        })
      : locationFiltered

    const grouped: Record<string, Employee[]> = {}
    searchFiltered.forEach(emp => {
      if (!grouped[emp.location]) {
        grouped[emp.location] = []
      }
      grouped[emp.location].push(emp)
    })

    Object.keys(grouped).forEach(location => {
      grouped[location].sort((a, b) => {
        const nameA = `${a.lastName} ${a.firstName}`.toLowerCase()
        const nameB = `${b.lastName} ${b.firstName}`.toLowerCase()
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* ── Branded Header ── */}
      <header className="heaton-header">
        <div className="heaton-header-inner">
          {/* Top row: Brand + Export */}
          <div className="heaton-header-top">
            <div className="heaton-brand">
              <div className="heaton-brand-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="heaton-brand-text">
                <h1>Heaton Eye Associates</h1>
                <p>Staff Directory</p>
              </div>
            </div>

            <ExportMenu
              employees={filteredEmployees}
              selectedLocation={selectedLocation}
            />
          </div>

          {/* Search */}
          <div className="heaton-search-row">
            <div className="heaton-search-wrapper">
              <svg
                className="heaton-search-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              <input
                id="employee-search"
                type="text"
                className="heaton-search-input"
                placeholder="Search employees..."
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && (
                <button
                  className="heaton-search-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <p className="heaton-result-count">
              {totalFilteredCount} of {employees.length} employees
            </p>
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

      {/* ── Main Content ── */}
      <main className="directory-main">
        {Object.keys(groupedEmployees).length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <h3 className="empty-state-title">No employees found</h3>
            <p className="empty-state-description">
              Try adjusting your search or location filter
            </p>
          </div>
        ) : (
          <div>
            {locations
              .filter(location => groupedEmployees[location])
              .map((location, locationIndex) => (
                <div
                  key={location}
                  className="location-section"
                  style={{ animationDelay: `${locationIndex * 0.08}s` }}
                >
                  {/* Location header (only in "All" view) */}
                  {selectedLocation === 'All' && (
                    <div className="location-section-header">
                      <h2 className="location-section-title">{location}</h2>
                      <span className="location-section-count">
                        {groupedEmployees[location].length} {groupedEmployees[location].length === 1 ? 'person' : 'people'}
                      </span>
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

                        {/* Info */}
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

                          {/* Contact */}
                          {(employee.email || employee.extension) && (
                            <div className="employee-details">
                              {employee.email && (
                                <div className="employee-detail-item">
                                  <svg className="employee-detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                  </svg>
                                  <a href={`mailto:${employee.email}`} className="employee-email">
                                    {employee.email}
                                  </a>
                                </div>
                              )}
                              {employee.extension && (
                                <div className="employee-detail-item">
                                  <svg className="employee-detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                  </svg>
                                  <span>Ext. {employee.extension}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
