'use client'

import { useState } from 'react'
import { Employee } from '@/types/employee'
import { PendingChange } from '@/types/admin'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface EmployeeManagementProps {
  employees: Employee[]
  onDataChange: () => void
}

export default function EmployeeManagement({ employees, onDataChange }: EmployeeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase()
    return (
      emp.firstName.toLowerCase().includes(search) ||
      emp.lastName.toLowerCase().includes(search) ||
      emp.email?.toLowerCase().includes(search) ||
      emp.location.toLowerCase().includes(search)
    )
  })

  const handleEdit = (employee: Employee) => {
    setEditingEmployee({ ...employee })
  }

  const handleSaveEdit = async () => {
    if (!editingEmployee) return

    const change: PendingChange = {
      id: ``,
      type: 'edit',
      employeeId: editingEmployee.id,
      before: employees.find(e => e.id === editingEmployee.id),
      after: editingEmployee,
      proposedBy: 'Admin',
      proposedAt: new Date().toISOString(),
      status: 'pending'
    }

    try {
      await fetch('/api/admin/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change)
      })

      setEditingEmployee(null)
      onDataChange()
      alert('Change submitted for approval!')
    } catch (error) {
      alert('Error submitting change')
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Mark ${employee.firstName} ${employee.lastName} for deletion?`)) return

    const change: PendingChange = {
      id: ``,
      type: 'delete',
      employeeId: employee.id,
      before: employee,
      proposedBy: 'Admin',
      proposedAt: new Date().toISOString(),
      status: 'pending'
    }

    try {
      await fetch('/api/admin/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change)
      })

      onDataChange()
      alert('Deletion submitted for approval!')
    } catch (error) {
      alert('Error submitting deletion')
    }
  }

  return (
    <div>
      {/* Search and Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search employees..."
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-medium)',
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => setShowAddForm(true)}
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
            fontWeight: '600'
          }}
        >
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          Add Employee
        </button>
      </div>

      {/* Employee Table */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--border-radius-large)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background-color)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Extension</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Location</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-text-color)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.slice(0, 50).map((employee) => (
                <tr key={employee.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--secondary-text-color)' }}>
                    {employee.email}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {employee.extension}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {employee.location}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--secondary-text-color)' }}>
                    {employee.title || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(employee)}
                        style={{
                          padding: '6px',
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--secondary-text-color)'
                        }}
                        title="Edit"
                      >
                        <PencilIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee)}
                        style={{
                          padding: '6px',
                          background: 'none',
                          border: '1px solid var(--error-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--error-color)'
                        }}
                        title="Delete"
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEmployees.length > 50 && (
          <div style={{
            padding: '12px 16px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--secondary-text-color)',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--background-color)'
          }}>
            Showing 50 of {filteredEmployees.length} employees
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEmployee && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--border-radius-large)',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Edit Employee</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                value={editingEmployee.firstName}
                onChange={(e) => setEditingEmployee({...editingEmployee, firstName: e.target.value})}
                placeholder="First Name"
                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <input
                value={editingEmployee.lastName}
                onChange={(e) => setEditingEmployee({...editingEmployee, lastName: e.target.value})}
                placeholder="Last Name"
                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <input
                value={editingEmployee.email || ''}
                onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                placeholder="Email"
                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <input
                value={editingEmployee.extension || ''}
                onChange={(e) => setEditingEmployee({...editingEmployee, extension: e.target.value})}
                placeholder="Extension"
                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <input
                value={editingEmployee.title || ''}
                onChange={(e) => setEditingEmployee({...editingEmployee, title: e.target.value})}
                placeholder="Title"
                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => setEditingEmployee(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
