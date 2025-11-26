export type EmploymentRole = 'staff' | 'admin'

export interface StaffWorkInfo {
  email: string
  location: string
  department: string
  position: string
  employeeNo: string
  jobGrade: string
  reportTo: string
  role: EmploymentRole
  status: 'ACTIVE' | 'INACTIVE'
}

export interface StaffPassportInfo {
  passportNo: string | null
  expiryDate: string | null
}

export interface StaffBankInfo {
  bankName: string
  accountNo: string
}

export interface StaffAllowanceInfo {
  allowance: boolean
  claim: boolean
}

export interface StaffProfile {
  id: string
  name: string
  fullName: string
  icNo: string
  gender: 'MALE' | 'FEMALE'
  dob: string | null
  age: number
  phone: string
  maritalStatus: string
  nationality: string
  work: StaffWorkInfo
  passport: StaffPassportInfo
  bank: StaffBankInfo
  allowance: StaffAllowanceInfo
  avatarUrl?: string
}

