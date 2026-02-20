'use client'

import { useState, useRef, useEffect } from 'react'
import { Employee } from '@/types/employee'

interface ExportMenuProps {
  employees: Employee[]
  selectedLocation: string
}

export default function ExportMenu({ employees, selectedLocation }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Extension', 'DID', 'Phone', 'Team', 'Location', 'Department', 'Title']
    const csvContent = [
      headers.join(','),
      ...employees.map(emp => [
        emp.firstName || '',
        emp.lastName || '',
        emp.email || '',
        emp.extension || '',
        emp.did || '',
        emp.phoneNumber || '',
        emp.team || '',
        emp.location || '',
        emp.department || '',
        emp.title || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const locationSuffix = selectedLocation === 'All' ? 'all-locations' : selectedLocation.toLowerCase().replace(/\s+/g, '-')
    link.download = `heaton-directory-${locationSuffix}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const exportToExcel = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Extension', 'DID', 'Phone', 'Team', 'Location', 'Department', 'Title']
    const csvContent = [
      headers.join('\t'),
      ...employees.map(emp => [
        emp.firstName || '',
        emp.lastName || '',
        emp.email || '',
        emp.extension || '',
        emp.did || '',
        emp.phoneNumber || '',
        emp.team || '',
        emp.location || '',
        emp.department || '',
        emp.title || ''
      ].join('\t'))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const locationSuffix = selectedLocation === 'All' ? 'all-locations' : selectedLocation.toLowerCase().replace(/\s+/g, '-')
    link.download = `heaton-directory-${locationSuffix}-${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="heaton-export-btn"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="heaton-export-dropdown">
          <button onClick={exportToCSV} className="heaton-export-option">
            <div className="heaton-export-option-label">Export as CSV</div>
            <div className="heaton-export-option-desc">{employees.length} employees</div>
          </button>
          <div className="heaton-export-divider" />
          <button onClick={exportToExcel} className="heaton-export-option">
            <div className="heaton-export-option-label">Export as Excel</div>
            <div className="heaton-export-option-desc">
              {selectedLocation === 'All' ? 'All locations' : selectedLocation}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
