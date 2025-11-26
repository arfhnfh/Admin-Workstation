export type BookStatus = 'available' | 'borrowed'

export interface BookCategory {
  id: string
  name: string
  icon: string
  color: string
}

export interface LibraryBook {
  id: string
  title: string
  author: string
  categoryId: string
  coverImage: string
  coverColor: string
  borrowerName: string | null
  borrowerAvatar?: string
  status: BookStatus
  dueDate?: string | null
  summary: string
  maxLoanDays: number
  qrCodeUrl?: string | null
  copyId?: string
  stats: {
    timesBorrowed: number
    rating: number
  }
  loans: BookLoan[]
}

export interface NewCategoryInput {
  name: string
  icon: string
  color: string
}

export interface NewBookInput {
  title: string
  author: string
  categoryId: string
  status: BookStatus
  summary: string
  coverColor: string
  coverUrl: string
  maxLoanDays: number
  timesBorrowed?: number
  rating?: number
  totalCopies?: number
}

export interface BookLoan {
  id: string
  borrowerName: string
  loanStatus: string
  loanedAt: string
  dueAt: string | null
  returnedAt: string | null
}

export interface CreateLoanInput {
  bookId: string
  copyId?: string
  borrowerName: string
  pickupDate: string
  returnDate: string
}

export interface LibraryLeaderboardEntry {
  staffId: string
  name: string
  avatar: string
  borrowedCount: number
}

export interface LibraryChatMessage {
  id: string
  sender: 'staff' | 'support'
  message: string
  timestamp: string
}

