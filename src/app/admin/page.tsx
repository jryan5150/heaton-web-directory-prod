'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import CSVImport from '@/components/CSVImport'
import AdminPanel from '@/components/AdminPanel'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportComplete = async (importedEmployees: Employee[]) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importedEmployees),
      })

      if (response.ok) {
        setEmployees(importedEmployees)
        setShowCSVImport(false)
        alert(`Successfully imported ${importedEmployees.length} employees!`)
      } else {
        alert('Failed to import employees')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import employees')
    }
  }

  const handleDataUpdate = async (updatedEmployees: Employee[]) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployees),
      })

      if (response.ok) {
        setEmployees(updatedEmployees)
        alert('Data updated successfully!')
      } else {
        alert('Failed to update data')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update data')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Directory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Manage employee directory data
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Employees</div>
            <div className="text-3xl font-bold text-blue-600">{employees.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Tyler</div>
            <div className="text-3xl font-bold text-blue-600">
              {employees.filter(e => e.location === 'Tyler').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Longview</div>
            <div className="text-3xl font-bold text-blue-600">
              {employees.filter(e => e.location === 'Longview').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Athens</div>
            <div className="text-3xl font-bold text-blue-600">
              {employees.filter(e => e.location === 'Athens').length}
            </div>
          </div>
        </div>

        {/* Admin Panel Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminPanel
            employees={employees}
            onDataUpdate={handleDataUpdate}
            onShowCSVImport={() => setShowCSVImport(true)}
            isImported={employees.length > 0}
          />
        </div>
      </div>

      {/* CSV Import Modal */}
      {showCSVImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CSVImport
              onImportComplete={handleImportComplete}
              onClose={() => setShowCSVImport(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
