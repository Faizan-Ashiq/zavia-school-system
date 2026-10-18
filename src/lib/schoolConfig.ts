export interface SchoolConfig {
  id: string
  name: string
  shortName: string
  email: string
  phone: string
  whatsapp: string
  address: string
  logo: string
  bankName: string
  accountTitle: string
  iban: string
}

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  id: process.env.NEXT_PUBLIC_SCHOOL_ID || 'zavia',
  name: 'Zavia School System',
  shortName: 'Zavia School System',
  email: 'zaviaschool2015@gmail.com',
  phone: '03014717700',
  whatsapp: '+92 301 4717700',
  address: 'Zavia School System Campus',
  logo: '/Zavia.jpeg',
  bankName: 'Meezan Bank Limited',
  accountTitle: 'Zavia School System Fee Collection',
  iban: 'PK90 MEZN 0001 2345 6789 01',
}

export function getSchoolConfig(): SchoolConfig {
  return DEFAULT_SCHOOL_CONFIG
}
