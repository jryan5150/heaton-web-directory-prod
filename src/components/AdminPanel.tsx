'use client'

import { useState } from 'react'
import { Employee } from '@/types/employee'
import { CogIcon, TrashIcon, PlusIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'

interface AdminPanelProps {
  employees: Employee[]
  onDataUpdate: (employees: Employee[]) => void
  onShowCSVImport: () => void
  isImported: boolean
}

export default function AdminPanel({ employees, onDataUpdate, onShowCSVImport, isImported }: AdminPanelProps) {
  const [showPanel, setShowPanel] = useState(false)

  const resetToSampleData = () => {
    // Import sample data dynamically
    import('@/lib/sampleData').then(({ sampleEmployees }) => {
      onDataUpdate(sampleEmployees)
    })
  }

  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Extension', 'DID', 'Team', 'Location', 'Department', 'Job Title']
    const csvContent = [
      headers.join(','),
      ...employees.map(emp => [
        emp.firstName,
        emp.lastName,
        emp.email || '',
        emp.extensionNumber || '',
        emp.did || '',
        emp.team,
        emp.location,
        emp.department || '',
        emp.jobTitle || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heaton-directory-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-heaton rounded-full shadow-modern-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 z-40"
        title="Admin Panel"
      >
        <CogIcon className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-modern-lg border border-white/50 p-4 space-y-3 z-40 min-w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-heaton-gray font-heading">Admin Panel</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <CogIcon className="w-5 h-5 text-heaton-gray-light" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-heaton-gray-light mb-2">
          <strong>{employees.length}</strong> employees • {isImported ? 'Imported' : 'Sample'} data
        </div>

        <button
          onClick={onShowCSVImport}
          className="w-full btn-modern bg-heaton-blue text-white hover:bg-heaton-blue-dark flex items-center space-x-2 text-sm py-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Import CSV</span>
        </button>

        <button
          onClick={exportToCSV}
          className="w-full btn-modern bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-2 text-sm py-2"
        >
          <CloudArrowDownIcon className="w-4 h-4" />
          <span>Export CSV</span>
        </button>

        {isImported && (
          <button
            onClick={resetToSampleData}
            className="w-full btn-modern bg-gray-600 text-white hover:bg-gray-700 flex items-center space-x-2 text-sm py-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Reset to Sample</span>
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 text-xs text-heaton-gray-light">
        Admin tools for data management
      </div>
    </div>
  )
}