import { create } from 'zustand'
import type { BookCategory, LibraryBook } from '@/types/library'

const HOT_THRESHOLD = 10

type LibraryAdminState = {
  categories: BookCategory[]
  books: LibraryBook[]
  addCategory: (payload: Omit<BookCategory, 'id'> & { id?: string }) => BookCategory
  addBook: (
    payload: Omit<LibraryBook, 'id' | 'stats'> & {
      id?: string
      timesBorrowed?: number
      rating?: number
      stats?: LibraryBook['stats']
      loans?: LibraryBook['loans']
    },
  ) => LibraryBook
  setCategories: (categories: BookCategory[]) => void
  setBooks: (books: LibraryBook[]) => void
}

export const useLibraryAdminStore = create<LibraryAdminState>((set) => ({
  categories: [],
  books: [],
  addCategory: (payload) => {
    const category: BookCategory = {
      id: payload.id ?? crypto.randomUUID(),
      name: payload.name,
      icon: payload.icon,
      color: payload.color,
    }
    set((state) => {
      const exists = state.categories.some((cat) => cat.id === category.id)
      const categories = exists
        ? state.categories.map((cat) => (cat.id === category.id ? category : cat))
        : [...state.categories, category]
      return { categories }
    })
    return category
  },
  addBook: (payload) => {
    const book: LibraryBook = {
      id: payload.id ?? crypto.randomUUID(),
      status: payload.status,
      categoryId: payload.categoryId,
      title: payload.title,
      author: payload.author,
      coverImage: payload.coverImage,
      coverColor: payload.coverColor ?? '#f7d6c4',
      borrowerName: payload.borrowerName ?? null,
      borrowerAvatar: payload.borrowerAvatar,
      dueDate: payload.dueDate,
      summary: payload.summary ?? '',
      maxLoanDays: payload.maxLoanDays ?? 14,
      qrCodeUrl: payload.qrCodeUrl,
      copyId: payload.copyId,
      stats:
        payload.stats ?? {
          timesBorrowed: payload.timesBorrowed ?? 0,
          rating: payload.rating ?? 4.5,
        },
      loans: payload.loans ?? [],
    }
    set((state) => {
      const exists = state.books.some((existing) => existing.id === book.id)
      const books = exists
        ? state.books.map((existing) => (existing.id === book.id ? book : existing))
        : [...state.books, book]
      return { books }
    })
    return book
  },
  setCategories: (categories) => set({ categories }),
  setBooks: (books) => set({ books }),
}))

export function isHotBook(timesBorrowed: number) {
  return timesBorrowed >= HOT_THRESHOLD
}

