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
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    extension: '',
    location: '',
    team: '',
    title: '',
    department: ''
  })

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

  const handleAddEmployee = async () => {
    // Validate required fields
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.location || !newEmployee.team) {
      alert('Please fill in all required fields (First Name, Last Name, Location, Team)')
      return
    }

    // Generate a temporary ID for the new employee
    const tempId = `emp-${Date.now()}-new`
    const employeeToAdd: Employee = {
      id: tempId,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email || '',
      extension: newEmployee.extension || '',
      location: newEmployee.location,
      team: newEmployee.team,
      title: newEmployee.title || '',
      department: newEmployee.department || ''
    }

    const change: PendingChange = {
      id: ``,
      type: 'add',
      employeeId: tempId,
      after: employeeToAdd,
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

      // Reset form and close modal
      setNewEmployee({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        extension: '',
        location: '',
        team: '',
        title: '',
        department: ''
      })
      setShowAddForm(false)
      onDataChange()
      alert('New employee submitted for approval!')
    } catch (error) {
      alert('Error submitting new employee')
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

      {/* Add Employee Modal */}
      {showAddForm && (
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
            <h3 style={{ marginTop: 0 }}>Add New Employee</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                placeholder="First Name *"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                placeholder="Last Name *"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                value={newEmployee.email || ''}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                placeholder="Email"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                value={newEmployee.extension || ''}
                onChange={(e) => setNewEmployee({...newEmployee, extension: e.target.value})}
                placeholder="Extension"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <select
                value={newEmployee.location}
                onChange={(e) => setNewEmployee({...newEmployee, location: e.target.value})}
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Location *</option>
                <option value="Tyler">Tyler</option>
                <option value="Athens">Athens</option>
                <option value="Longview">Longview</option>
                <option value="Gun Barrel City">Gun Barrel City</option>
              </select>
              <input
                value={newEmployee.team || ''}
                onChange={(e) => setNewEmployee({...newEmployee, team: e.target.value})}
                placeholder="Team *"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                value={newEmployee.title || ''}
                onChange={(e) => setNewEmployee({...newEmployee, title: e.target.value})}
                placeholder="Title"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                value={newEmployee.department || ''}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                placeholder="Department"
                style={{
                  padding: '10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: 'rgba(49, 130, 206, 0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--secondary-text-color)'
              }}>
                * Required fields
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={handleAddEmployee}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--success-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewEmployee({
                      id: '',
                      firstName: '',
                      lastName: '',
                      email: '',
                      extension: '',
                      location: '',
                      team: '',
                      title: '',
                      department: ''
                    })
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
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
