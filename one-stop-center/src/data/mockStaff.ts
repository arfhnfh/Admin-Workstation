import type { StaffProfile } from '@/types/staff'

export const mockStaff: StaffProfile[] = [
  {
    id: 'hamiduddin',
    name: 'Hamiduddin',
    fullName: 'MOHAMAD HAMIDUDDIN BIN ISMAIL',
    icNo: '931205025443',
    gender: 'MALE',
    dob: '1993-12-05',
    age: 31,
    phone: '60195159390',
    maritalStatus: 'MARRIED',
    nationality: 'MALAYSIAN',
    work: {
      email: 'hamiduddin@aafiyatgroup.com',
      location: 'Kedah',
      department: 'Project Management',
      position: 'Executive - Project Management - Aafiyat World',
      employeeNo: 'OHR140',
      jobGrade: 'E1',
      reportTo: 'MUHAMMAD SOLIHIN BIN MOHD RAZALI',
      role: 'staff',
      status: 'ACTIVE',
    },
    passport: {
      passportNo: null,
      expiryDate: null,
    },
    bank: {
      bankName: 'MALAYAN BANKING BERHAD',
      accountNo: '163019558880',
    },
    allowance: {
      allowance: true,
      claim: true,
    },
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'aiman',
    name: 'Aiman',
    fullName: 'AIMAN FAHMI BIN SULAIMAN',
    icNo: '900602105511',
    gender: 'MALE',
    dob: '1990-06-02',
    age: 34,
    phone: '60126688990',
    maritalStatus: 'SINGLE',
    nationality: 'MALAYSIAN',
    work: {
      email: 'aiman@aafiyatgroup.com',
      location: 'Kuala Lumpur',
      department: 'Innovation',
      position: 'Product Owner',
      employeeNo: 'OHR098',
      jobGrade: 'M2',
      reportTo: 'NUR SYAFIQAH BT SAAD',
      role: 'admin',
      status: 'ACTIVE',
    },
    passport: {
      passportNo: 'A2087332',
      expiryDate: '2029-10-15',
    },
    bank: {
      bankName: 'CIMB',
      accountNo: '7660023356',
    },
    allowance: {
      allowance: true,
      claim: true,
    },
    avatarUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
  },
]

export function getMockStaffById(id: string) {
  return mockStaff.find((staff) => staff.id === id) ?? mockStaff[0]
}

