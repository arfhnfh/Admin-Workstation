import QRCode from 'qrcode'
import { chatMessages, leaderboard, libraryCategories, popularBooks } from '@/data/mockLibrary'
import { supabase } from '@/lib/supabaseClient'
import type {
  BookCategory,
  BookLoan,
  CreateLoanInput,
  LibraryBook,
  LibraryChatMessage,
  LibraryLeaderboardEntry,
  NewBookInput,
  NewCategoryInput,
} from '@/types/library'
import { useLibraryAdminStore } from '@/store/libraryAdminStore'

export interface LibraryOverview {
  categories: BookCategory[]
  books: LibraryBook[]
  leaderboard: LibraryLeaderboardEntry[]
  chats: LibraryChatMessage[]
}

export async function fetchLibraryOverview(): Promise<LibraryOverview> {
  if (!supabase) {
    const store = useLibraryAdminStore.getState()
    store.setCategories(libraryCategories)
    store.setBooks(
      popularBooks.map((book) => ({
        ...book,
        maxLoanDays: book.maxLoanDays ?? 14,
        qrCodeUrl: book.qrCodeUrl ?? null,
        loans: book.loans ?? [],
      })),
    )
    return {
      categories: libraryCategories,
      books: store.books,
      leaderboard,
      chats: chatMessages,
    }
  }

  const [{ data: categories }, { data: booksData }] = await Promise.all([
    supabase.from('book_categories').select('*'),
    supabase
      .from('books')
      .select(
        `
        id,
        title,
        author,
        cover_url,
        category_id,
        synopsis,
        max_loan_days,
        qr_code_url,
        book_copies (
          id,
          status,
          book_loans (
            id,
            borrower_name,
            loan_status,
            loaned_at,
            due_at,
            returned_at,
            notes
          )
        )
      `,
      ),
  ])

  const normalizedBooks: LibraryBook[] = await Promise.all(
    ((booksData as any[] | null) ?? []).map(async (row) => {
      const loans: BookLoan[] =
        row.book_copies?.flatMap((copy: any) =>
          copy.book_loans?.map((loan: any) => ({
            id: loan.id,
            borrowerName: loan.borrower_name ?? loan.notes ?? 'Unknown',
            loanStatus: loan.loan_status,
            loanedAt: loan.loaned_at,
            dueAt: loan.due_at,
            returnedAt: loan.returned_at,
          })) ?? [],
        ) ?? []

      const activeLoan = loans.find((loan) => loan.loanStatus === 'ON_LOAN')
      const qrCodeUrl = row.qr_code_url ?? (await QRCode.toDataURL(`book:${row.id}`))

      if (!row.qr_code_url && supabase) {
        void supabase
          .from('books')
          .update({ qr_code_url: qrCodeUrl })
          .eq('id', row.id)
          .then(({ error }) => {
            if (error) {
              console.warn('Failed to backfill QR code URL for book', row.id, error.message)
            }
          })
      }

      return {
        id: row.id,
        title: row.title,
        author: row.author,
        categoryId: row.category_id ?? '',
        coverImage: row.cover_url ?? '',
        coverColor: '#f7d6c4',
        borrowerName: activeLoan?.borrowerName ?? null,
        borrowerAvatar: undefined,
        status: activeLoan ? 'borrowed' : 'available',
        dueDate: activeLoan?.dueAt ?? null,
        summary: row.synopsis ?? '',
        maxLoanDays: row.max_loan_days ?? 14,
        qrCodeUrl,
        copyId: row.book_copies?.[0]?.id,
        stats: {
          timesBorrowed: loans.length,
          rating: 4.5,
        },
        loans,
      }
    }),
  )

  const resolvedCategories = (categories as BookCategory[] | null) ?? []

  const store = useLibraryAdminStore.getState()
  store.setCategories(resolvedCategories)
  store.setBooks(normalizedBooks)

  return {
    categories: resolvedCategories,
    books: normalizedBooks,
    leaderboard,
    chats: chatMessages,
  }
}

export async function createCategory(input: NewCategoryInput): Promise<BookCategory> {
  if (!supabase) {
    return useLibraryAdminStore.getState().addCategory(input)
  }

  const { data, error } = await supabase
    .from('book_categories')
    .insert({ name: input.name, icon: input.icon, color: input.color })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create category')
  }

  const category: BookCategory = {
    id: data.id,
    name: data.name,
    icon: data.icon ?? 'Book',
    color: data.color ?? '#f4c9a8',
  }

  useLibraryAdminStore.getState().addCategory(category)
  return category
}

export async function createBook(input: NewBookInput): Promise<LibraryBook> {
  if (!supabase) {
    return useLibraryAdminStore.getState().addBook({
      ...input,
      coverImage: input.coverUrl,
      borrowerName: null,
      summary: input.summary,
      maxLoanDays: input.maxLoanDays,
      loans: [],
    })
  }

  const { data, error } = await supabase
    .from('books')
    .insert({
      category_id: input.categoryId,
      title: input.title,
      author: input.author,
      cover_url: input.coverUrl,
      synopsis: input.summary,
      total_copies: input.totalCopies ?? 1,
      max_loan_days: input.maxLoanDays,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create book')
  }

  const copyStatus = input.status === 'available' ? 'AVAILABLE' : 'ON_LOAN'
  const { data: copy } = await supabase
    .from('book_copies')
    .insert({
      book_id: data.id,
      status: copyStatus,
      inventory_code: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    })
    .select('*')
    .single()

  const qrCodeUrl = await uploadQrCodeForBook(data.id)
  await supabase.from('books').update({ qr_code_url: qrCodeUrl }).eq('id', data.id)

  const book: LibraryBook = {
    id: data.id,
    title: data.title,
    author: data.author,
    categoryId: data.category_id,
    coverImage: data.cover_url ?? input.coverUrl,
    coverColor: input.coverColor ?? '#f7d6c4',
    borrowerName: null,
    status: input.status,
    dueDate: null,
    summary: data.synopsis ?? '',
    maxLoanDays: input.maxLoanDays,
    qrCodeUrl,
    copyId: copy?.id,
    stats: {
      timesBorrowed: 0,
      rating: input.rating ?? 4.5,
    },
    loans: [],
  }

  useLibraryAdminStore.getState().addBook(book)
  return book
}

export async function uploadBookCover(file: File): Promise<string> {
  if (!supabase) {
    return readFileAsDataUrl(file)
  }

  const bucket = 'book-covers'
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadQrCodeForBook(bookId: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(`book:${bookId}`)
  if (!supabase) return qrDataUrl

  try {
    const res = await fetch(qrDataUrl)
    const blob = await res.blob()
    const file = new File([blob], `${bookId}.png`, { type: 'image/png' })
    const bucket = 'book-qrcodes'
    const path = `${bookId}.png`
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    })
    if (error) {
      console.warn('Failed to upload QR code', error.message)
      return qrDataUrl
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl ?? qrDataUrl
  } catch (error) {
    console.warn('Failed to upload QR code', error)
    return qrDataUrl
  }
}

export async function fetchBookCategories(): Promise<BookCategory[]> {
  if (!supabase) {
    const store = useLibraryAdminStore.getState()
    store.setCategories(libraryCategories)
    return libraryCategories
  }

  const { data, error } = await supabase.from('book_categories').select('*').order('name')

  if (error) {
    throw new Error(error.message)
  }

  const categories = (data as BookCategory[]) ?? []
  useLibraryAdminStore.getState().setCategories(categories)
  return categories
}

export async function createBookLoan(input: CreateLoanInput) {
  if (!supabase) {
    console.info('Mock book loan', input)
    return
  }

  let copyId = input.copyId
  if (!copyId) {
    const { data: copy } = await supabase
      .from('book_copies')
      .select('id')
      .eq('book_id', input.bookId)
      .eq('status', 'AVAILABLE')
      .limit(1)
      .maybeSingle()
    copyId = copy?.id
  }

  if (!copyId) {
    throw new Error('Unable to locate book copy for loan creation')
  }

  const { error, data } = await supabase
    .from('book_loans')
    .insert({
      copy_id: copyId,
      borrower_name: input.borrowerName,
      loan_status: 'ON_LOAN',
      loaned_at: input.pickupDate,
      due_at: input.returnDate,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await supabase.from('book_copies').update({ status: 'ON_LOAN' }).eq('id', copyId)
  return data
}

export interface ScanResult {
  pickupDate: string
  dueDate: string
}

export async function scanBookQrCode(
  bookId: string,
  borrowerName: string,
  copyId?: string,
): Promise<ScanResult | void> {
  if (!supabase) {
    const pickupDate = new Date().toISOString()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    console.info('Mock QR scan', { bookId, copyId, borrowerName, pickupDate, dueDate: dueDate.toISOString() })
    return { pickupDate, dueDate: dueDate.toISOString() }
  }

  // Find available copy if copyId not provided
  let targetCopyId = copyId
  if (!targetCopyId) {
    const { data: copy } = await supabase
      .from('book_copies')
      .select('id')
      .eq('book_id', bookId)
      .eq('status', 'AVAILABLE')
      .limit(1)
      .maybeSingle()
    targetCopyId = copy?.id
  }

  if (!targetCopyId) {
    // Check if book exists but all copies are on loan
    const { data: copies } = await supabase
      .from('book_copies')
      .select('status')
      .eq('book_id', bookId)
    
    if (copies && copies.length > 0) {
      const allOnLoan = copies.every((copy: any) => copy.status === 'ON_LOAN')
      if (allOnLoan) {
        throw new Error('All copies of this book are currently on loan. Please try another book.')
      }
    }
    throw new Error('No available copy found for this book. Please contact admin.')
  }

  // Create loan record
  const pickupDate = new Date().toISOString()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14) // Default 14 days, will be updated with book's max_loan_days

  // Get book's max_loan_days
  const { data: book } = await supabase
    .from('books')
    .select('max_loan_days')
    .eq('id', bookId)
    .single()

  if (book?.max_loan_days) {
    dueDate.setDate(dueDate.getDate() + (book.max_loan_days - 14))
  }

  const { error: loanError } = await supabase
    .from('book_loans')
    .insert({
      copy_id: targetCopyId,
      borrower_name: borrowerName,
      loan_status: 'ON_LOAN',
      loaned_at: pickupDate,
      due_at: dueDate.toISOString(),
    })

  if (loanError) {
    throw new Error(loanError.message)
  }

  // Update copy status to ON_LOAN
  const { error: copyError } = await supabase
    .from('book_copies')
    .update({ status: 'ON_LOAN' })
    .eq('id', targetCopyId)

  if (copyError) {
    throw new Error(copyError.message)
  }

  return { pickupDate, dueDate: dueDate.toISOString() }
}

export async function sendChatMessage(message: LibraryChatMessage): Promise<void> {
  if (!supabase) {
    console.info('Mock chat message', message)
    return
  }

  // You can create a chat_messages table in Supabase if needed
  // For now, we'll just log it
  console.log('Chat message:', message)
  
  // If you have a chat_messages table:
  // await supabase.from('chat_messages').insert({
  //   sender: message.sender,
  //   message: message.message,
  //   timestamp: message.timestamp,
  // })
}

