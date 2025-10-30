/**
 * Database operations for employee data
 * Uses JSON file storage for simplicity and Vercel compatibility
 */

import fs from 'fs'
import path from 'path'
import { Employee } from '@/types/employee'

const DATA_DIR = path.join(process.cwd(), 'data')
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json')

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * Get all employees from database
 */
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    if (!fs.existsSync(EMPLOYEES_FILE)) {
      return []
    }

    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading employees:', error)
    return []
  }
}

/**
 * Save employees to database
 */
export async function saveEmployees(employees: Employee[]): Promise<void> {
  try {
    ensureDataDir()
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2))
  } catch (error) {
    console.error('Error saving employees:', error)
    throw new Error('Failed to save employees')
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const employees = await getAllEmployees()
  return employees.find(emp => emp.id === id) || null
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  const employees = await getAllEmployees()
  const index = employees.findIndex(emp => emp.id === id)

  if (index === -1) {
    return null
  }

  employees[index] = { ...employees[index], ...updates }
  await saveEmployees(employees)

  return employees[index]
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: string): Promise<boolean> {
  const employees = await getAllEmployees()
  const filtered = employees.filter(emp => emp.id !== id)

  if (filtered.length === employees.length) {
    return false
  }

  await saveEmployees(filtered)
  return true
}

/**
 * Add new employee
 */
export async function addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
  const employees = await getAllEmployees()

  const newEmployee: Employee = {
    ...employee,
    id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  employees.push(newEmployee)
  await saveEmployees(employees)

  return newEmployee
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