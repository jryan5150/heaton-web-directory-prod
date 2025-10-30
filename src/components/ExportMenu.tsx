'use client'

import { useState, useRef, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface ExportMenuProps {
  employees: Employee[]
  selectedLocation: string
}

export default function ExportMenu({ employees, selectedLocation }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
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
    // For now, export as CSV with .xls extension (Excel will open it)
    // In the future, we could add xlsx library for proper Excel format
    const headers = ['First Name', 'Last Name', 'Email', 'Extension', 'DID', 'Phone', 'Team', 'Location', 'Department', 'Title']
    const csvContent = [
      headers.join('\t'), // Tab-separated for better Excel compatibility
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--border-radius-medium)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-small)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-color-hover)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-medium)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent-color)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-small)'
        }}
      >
        <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          background: 'white',
          borderRadius: 'var(--border-radius-medium)',
          boxShadow: 'var(--shadow-large)',
          border: '1px solid var(--border-color)',
          minWidth: '180px',
          overflow: 'hidden',
          zIndex: 1000,
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <button
            onClick={exportToCSV}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--primary-text-color)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--background-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ fontWeight: '500' }}>Export to CSV</div>
            <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
              {employees.length} employees
            </div>
          </button>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          <button
            onClick={exportToExcel}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--primary-text-color)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--background-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ fontWeight: '500' }}>Export to Excel</div>
            <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
              {selectedLocation === 'All' ? 'All locations' : selectedLocation}
            </div>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
