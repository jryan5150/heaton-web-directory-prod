/**
 * Import and transform Heaton Eye CSV data into Employee format
 */

import Papa from 'papaparse'
import { Employee } from '@/types/employee'

interface HeatonCSVRow {
  Name: string
  Email: string
  Extension: string
  DID: string
  Team: string
  Location: string
  Department: string
  'Job Title': string
}

/**
 * Parse Heaton CSV file and convert to Employee array
 */
export async function parseHeatonCSV(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const employees = convertHeatonToEmployees(results.data as HeatonCSVRow[])
          resolve(employees)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Convert Heaton CSV rows to Employee objects
 */
export function convertHeatonToEmployees(rows: HeatonCSVRow[]): Employee[] {
  return rows
    .filter(row => row.Name && row.Email) // Filter out invalid rows
    .filter(row => !row.Name.includes('Call Park')) // Filter out system accounts
    .filter(row => !row.Name.includes('Elevator')) // Filter out non-person entries
    .filter(row => !row.Name.match(/^(HEA |Break Room|Conference Room|Copy Room|Tech |Doctor Station|Optical Lab|Work Room|ASC |ASCAN |LLSC |Laser Room|History |Tech|BLDG |Courtesy |Directories |Patient Phone|Pedi |Central |Special |Sterile |Visual |L-ASC |V-F |East Work)/)) // Filter out rooms and equipment
    .map((row, index) => {
      const nameParts = row.Name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Normalize location
      let location = row.Location?.trim() || ''
      if (location === 'Gun Barrel City') location = 'Gun Barrel City'

      return {
        id: `heaton-${index + 1}`,
        firstName,
        lastName,
        email: row.Email?.trim() || '',
        extension: row.Extension?.trim() || undefined,
        phoneNumber: row.DID?.trim() || undefined,
        team: row.Department?.trim() || undefined,
        location,
        title: row['Job Title'] === 'User' ? undefined : row['Job Title']?.trim(),
        department: row.Department?.trim() || undefined,
      } as Employee
    })
    .sort((a, b) => {
      // Sort by last name, then first name
      const lastNameCompare = a.lastName.localeCompare(b.lastName)
      if (lastNameCompare !== 0) return lastNameCompare
      return a.firstName.localeCompare(b.firstName)
    })
}

/**
 * Load Heaton employees from CSV file path
 */
export async function loadHeatonEmployeesFromPath(filePath: string): Promise<Employee[]> {
  if (typeof window === 'undefined') {
    // Server-side: use fs
    const fs = require('fs')
    const csvContent = fs.readFileSync(filePath, 'utf8')

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const employees = convertHeatonToEmployees(results.data as HeatonCSVRow[])
            resolve(employees)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  } else {
    throw new Error('loadHeatonEmployeesFromPath can only be called on the server')
  }
}