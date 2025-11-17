/**
 * Database operations for employee data
 * Uses Prisma with Vercel Postgres for persistent storage
 */

import prisma from './db'
import { Employee } from '@/types/employee'

/**
 * Get all employees from database
 */
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Map Prisma model to Employee type
    return employees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || undefined,
      extension: emp.extension || undefined,
      phoneNumber: emp.phoneNumber || undefined,
      did: emp.did || undefined,
      location: emp.location,
      team: emp.team,
      title: emp.title || undefined,
      jobTitle: emp.jobTitle || undefined,
      department: emp.department || undefined,
      photoUrl: emp.photoUrl || undefined,
      avatarUrl: emp.avatarUrl || undefined,
    }))
  } catch (error) {
    console.error('Error reading employees:', error)
    return []
  }
}

/**
 * Save employees to database (bulk replace)
 */
export async function saveEmployees(employees: Employee[]): Promise<void> {
  try {
    // Use transaction to delete all and insert new
    await prisma.$transaction([
      prisma.employee.deleteMany(),
      ...employees.map(emp => prisma.employee.create({
        data: {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email || null,
          extension: emp.extension || null,
          phoneNumber: emp.phoneNumber || null,
          did: emp.did || null,
          location: emp.location,
          team: emp.team || '',
          title: emp.title || null,
          jobTitle: emp.jobTitle || null,
          department: emp.department || null,
          photoUrl: emp.photoUrl || null,
          avatarUrl: emp.avatarUrl || null,
        }
      }))
    ])
  } catch (error) {
    console.error('Error saving employees:', error)
    throw new Error('Failed to save employees')
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id }
    })

    if (!emp) return null

    return {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || undefined,
      extension: emp.extension || undefined,
      phoneNumber: emp.phoneNumber || undefined,
      did: emp.did || undefined,
      location: emp.location,
      team: emp.team,
      title: emp.title || undefined,
      jobTitle: emp.jobTitle || undefined,
      department: emp.department || undefined,
      photoUrl: emp.photoUrl || undefined,
      avatarUrl: emp.avatarUrl || undefined,
    }
  } catch (error) {
    console.error('Error getting employee:', error)
    return null
  }
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  try {
    const emp = await prisma.employee.update({
      where: { id },
      data: {
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email || null,
        extension: updates.extension || null,
        phoneNumber: updates.phoneNumber || null,
        did: updates.did || null,
        location: updates.location,
        team: updates.team,
        title: updates.title || null,
        jobTitle: updates.jobTitle || null,
        department: updates.department || null,
        photoUrl: updates.photoUrl || null,
        avatarUrl: updates.avatarUrl || null,
      }
    })

    return {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || undefined,
      extension: emp.extension || undefined,
      phoneNumber: emp.phoneNumber || undefined,
      did: emp.did || undefined,
      location: emp.location,
      team: emp.team,
      title: emp.title || undefined,
      jobTitle: emp.jobTitle || undefined,
      department: emp.department || undefined,
      photoUrl: emp.photoUrl || undefined,
      avatarUrl: emp.avatarUrl || undefined,
    }
  } catch (error) {
    console.error('Error updating employee:', error)
    return null
  }
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    await prisma.employee.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error('Error deleting employee:', error)
    return false
  }
}

/**
 * Add new employee
 */
export async function addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
  try {
    const emp = await prisma.employee.create({
      data: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email || null,
        extension: employee.extension || null,
        phoneNumber: employee.phoneNumber || null,
        did: employee.did || null,
        location: employee.location,
        team: employee.team || '',
        title: employee.title || null,
        jobTitle: employee.jobTitle || null,
        department: employee.department || null,
        photoUrl: employee.photoUrl || null,
        avatarUrl: employee.avatarUrl || null,
      }
    })

    return {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || undefined,
      extension: emp.extension || undefined,
      phoneNumber: emp.phoneNumber || undefined,
      did: emp.did || undefined,
      location: emp.location,
      team: emp.team,
      title: emp.title || undefined,
      jobTitle: emp.jobTitle || undefined,
      department: emp.department || undefined,
      photoUrl: emp.photoUrl || undefined,
      avatarUrl: emp.avatarUrl || undefined,
    }
  } catch (error) {
    console.error('Error adding employee:', error)
    throw new Error('Failed to add employee')
  }
}

/**
 * Search employees
 */
export async function searchEmployees(query: string): Promise<Employee[]> {
  const employees = await getAllEmployees()
  const lowerQuery = query.toLowerCase()

  return employees.filter(emp =>
    emp.firstName.toLowerCase().includes(lowerQuery) ||
    emp.lastName.toLowerCase().includes(lowerQuery) ||
    emp.email?.toLowerCase().includes(lowerQuery) ||
    emp.department?.toLowerCase().includes(lowerQuery) ||
    emp.location.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get employees by location
 */
export async function getEmployeesByLocation(location: string): Promise<Employee[]> {
  const employees = await getAllEmployees()
  return employees.filter(emp => emp.location === location)
}

/**
 * Get employees by department
 */
export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  const employees = await getAllEmployees()
  return employees.filter(emp => emp.department === department)
}

/**
 * Get unique locations
 */
export async function getLocations(): Promise<string[]> {
  const employees = await getAllEmployees()
  const locations = new Set(employees.map(emp => emp.location))
  return Array.from(locations).sort()
}

/**
 * Get unique departments
 */
export async function getDepartments(): Promise<string[]> {
  const employees = await getAllEmployees()
  const departments = new Set(
    employees
      .map(emp => emp.department)
      .filter((dept): dept is string => !!dept)
  )
  return Array.from(departments).sort()
}

/**
 * Get statistics
 */
export async function getStatistics() {
  const employees = await getAllEmployees()
  const locations = await getLocations()
  const departments = await getDepartments()

  const locationCounts = locations.map(location => ({
    location,
    count: employees.filter(emp => emp.location === location).length
  }))

  const departmentCounts = departments.map(department => ({
    department,
    count: employees.filter(emp => emp.department === department).length
  }))

  return {
    total: employees.length,
    locations: locationCounts,
    departments: departmentCounts
  }
}
