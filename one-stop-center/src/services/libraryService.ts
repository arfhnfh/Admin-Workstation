import QRCode from 'qrcode'
import { chatMessages, libraryCategories, popularBooks } from '@/data/mockLibrary'
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

function getFallbackAvatar(name: string) {
  const safeName = encodeURIComponent(name || 'User')
  return `https://ui-avatars.com/api/?name=${safeName}&background=ded2fb&color=2e2a3b`
}

function buildLeaderboardFromBooks(books: LibraryBook[], limit = 10): LibraryLeaderboardEntry[] {
  const counts = new Map<
    string,
    {
      displayName: string
      count: number
    }
  >()

  for (const book of books) {
    for (const loan of book.loans) {
      const rawName = loan.borrowerName?.trim()
      if (!rawName) continue

      const identifier = rawName.toLowerCase()
      const existing = counts.get(identifier)
      if (existing) {
        existing.count += 1
      } else {
        counts.set(identifier, {
          displayName: rawName,
          count: 1,
        })
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([identifier, info]) => ({
      staffId: identifier,
      name: info.displayName,
      avatar: getFallbackAvatar(info.displayName),
      borrowedCount: info.count,
    }))
}

async function attachStaffProfilesToLeaderboard(
  entries: LibraryLeaderboardEntry[],
): Promise<LibraryLeaderboardEntry[]> {
  if (!supabase || !entries.length) return entries

  // Fetch staff profiles (including nested work.email and avatarUrl from the view)
  const { data, error } = await supabase.from('staff_view').select('*')

  if (error || !data) {
    console.warn('Failed to load staff profiles for leaderboard', error?.message)
    return entries
  }

  const byEmail = new Map<string, any>()
  ;(data as any[]).forEach((row) => {
    const email: string | undefined = row.work?.email ?? row.email ?? row.work_email
    if (!email) return
    const key = email.trim().toLowerCase()
    if (!key) return
    if (!byEmail.has(key)) {
      byEmail.set(key, row)
    }
  })

  // First, enrich entries with staff profile data (name/avatar/id)
  const enriched = entries.map((entry) => {
    const key = entry.staffId.toLowerCase()
    const emailKey = key.includes('@') ? key : undefined
    const usernameKey = key.includes('@') ? key.split('@')[0] : key

    let staff = emailKey ? byEmail.get(emailKey) : undefined

    if (!staff) {
      // Try match by username part before @
      staff = Array.from(byEmail.values()).find((row: any) => {
        const email: string | undefined = row.work?.email ?? row.email ?? row.work_email
        if (!email) return false
        const uname = email.trim().toLowerCase().split('@')[0]
        return uname === usernameKey
      })
    }

    if (!staff) return entry

    const displayName: string =
      staff.fullName ||
      staff.full_name ||
      staff.name ||
      entry.name

    const avatarUrl: string | undefined = staff.avatarUrl ?? staff.avatar_url

    return {
      staffId: staff.id ?? entry.staffId,
      name: displayName,
      avatar: avatarUrl || getFallbackAvatar(displayName),
      borrowedCount: entry.borrowedCount,
    }
  })

  // Then, merge duplicates that now point to the same staffId (same person)
  const merged = new Map<string, LibraryLeaderboardEntry>()

  for (const entry of enriched) {
    const key = String(entry.staffId).toLowerCase()
    const existing = merged.get(key)
    if (existing) {
      merged.set(key, {
        ...existing,
        borrowedCount: existing.borrowedCount + entry.borrowedCount,
      })
    } else {
      merged.set(key, entry)
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.borrowedCount - a.borrowedCount)
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

    const leaderboardFromBooks = buildLeaderboardFromBooks(store.books)

    return {
      categories: libraryCategories,
      books: store.books,
      leaderboard: leaderboardFromBooks,
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

  // Build leaderboard purely from actual loan records
  let dynamicLeaderboard: LibraryLeaderboardEntry[] = []
  try {
    const baseLeaderboard = buildLeaderboardFromBooks(normalizedBooks, 10)
    dynamicLeaderboard = await attachStaffProfilesToLeaderboard(baseLeaderboard)
  } catch (error) {
    console.warn('Failed to build library leaderboard from books', error)
  }

  return {
    categories: resolvedCategories,
    books: normalizedBooks,
    leaderboard: dynamicLeaderboard,
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

export async function updateBook(bookId: string, input: NewBookInput): Promise<LibraryBook> {
  if (!supabase) {
    const store = useLibraryAdminStore.getState()
    const existing = store.books.find((b) => b.id === bookId)
    if (!existing) {
      throw new Error('Book not found in local store')
    }

    const updated: LibraryBook = {
      ...existing,
      title: input.title,
      author: input.author,
      categoryId: input.categoryId,
      coverImage: input.coverUrl,
      coverColor: input.coverColor ?? existing.coverColor,
      summary: input.summary,
      maxLoanDays: input.maxLoanDays,
      status: input.status,
      stats: {
        timesBorrowed: input.timesBorrowed ?? existing.stats.timesBorrowed,
        rating: input.rating ?? existing.stats.rating,
      },
    }

    store.addBook(updated)
    return updated
  }

  const { data, error } = await supabase
    .from('books')
    .update({
      category_id: input.categoryId,
      title: input.title,
      author: input.author,
      cover_url: input.coverUrl,
      synopsis: input.summary,
      max_loan_days: input.maxLoanDays,
    })
    .eq('id', bookId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update book')
  }

  const store = useLibraryAdminStore.getState()
  const existing = store.books.find((b) => b.id === bookId)

  const updated: LibraryBook = {
    id: data.id,
    title: data.title,
    author: data.author,
    categoryId: data.category_id,
    coverImage: data.cover_url ?? input.coverUrl,
    coverColor: input.coverColor ?? existing?.coverColor ?? '#f7d6c4',
    borrowerName: existing?.borrowerName ?? null,
    status: input.status,
    dueDate: existing?.dueDate ?? null,
    summary: data.synopsis ?? input.summary,
    maxLoanDays: input.maxLoanDays,
    qrCodeUrl: existing?.qrCodeUrl,
    copyId: existing?.copyId,
    stats: {
      timesBorrowed: input.timesBorrowed ?? existing?.stats.timesBorrowed ?? 0,
      rating: input.rating ?? existing?.stats.rating ?? 4.5,
    },
    loans: existing?.loans ?? [],
  }

  store.addBook(updated)
  return updated
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

export type ScanMode = 'borrow' | 'return'

export interface ScanResult {
  pickupDate?: string
  dueDate?: string
  mode: ScanMode
  message?: string
}

export async function scanBookQrCode(
  bookId: string,
  borrowerName: string,
  copyId?: string,
  mode: ScanMode = 'borrow',
): Promise<ScanResult | void> {
  const normalizedRequester = borrowerName?.trim().toLowerCase()
  if (!normalizedRequester) {
    throw new Error('Unable to identify the staff account. Please sign in again.')
  }

  if (!supabase) {
    const now = new Date().toISOString()
    if (mode === 'return') {
      console.info('Mock QR return scan', { bookId, copyId, borrowerName })
      return { mode: 'return', pickupDate: now, dueDate: now, message: 'Mock return recorded' }
    }
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    console.info('Mock QR borrow scan', { bookId, copyId, borrowerName, pickupDate: now, dueDate: dueDate.toISOString() })
    return { pickupDate: now, dueDate: dueDate.toISOString(), mode: 'borrow' }
  }

  // Find available copy if copyId not provided
  let targetCopyId = copyId
  if (mode === 'borrow') {
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
      const { data: copies } = await supabase.from('book_copies').select('status').eq('book_id', bookId)
      if (copies && copies.length > 0) {
        const allOnLoan = copies.every((copy: any) => copy.status === 'ON_LOAN')
        if (allOnLoan) {
          throw new Error('All copies of this book are currently on loan. Please try another book.')
        }
      }
      throw new Error('No available copy found for this book. Please contact admin.')
    }

    const pickupDate = new Date().toISOString()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    const { data: book } = await supabase.from('books').select('max_loan_days').eq('id', bookId).single()
    if (book?.max_loan_days) {
      dueDate.setDate(dueDate.getDate() + (book.max_loan_days - 14))
    }

    const { error: loanError } = await supabase
      .from('book_loans')
      .insert({
        copy_id: targetCopyId,
        borrower_name: borrowerName.trim(),
        loan_status: 'ON_LOAN',
        loaned_at: pickupDate,
        due_at: dueDate.toISOString(),
      })

    if (loanError) {
      throw new Error(loanError.message)
    }

    const { error: copyError } = await supabase.from('book_copies').update({ status: 'ON_LOAN' }).eq('id', targetCopyId)
    if (copyError) {
      throw new Error(copyError.message)
    }

    return { pickupDate, dueDate: dueDate.toISOString(), mode: 'borrow' }
  }

  // Return flow
  if (!targetCopyId) {
    const { data: copy } = await supabase
      .from('book_copies')
      .select('id')
      .eq('book_id', bookId)
      .eq('status', 'ON_LOAN')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    targetCopyId = copy?.id
  }

  if (!targetCopyId) {
    throw new Error('No active loan found for this book.')
  }

  const { data: activeLoan, error: activeLoanError } = await supabase
    .from('book_loans')
    .select('id, loaned_at, due_at, borrower_name')
    .eq('copy_id', targetCopyId)
    .eq('loan_status', 'ON_LOAN')
    .order('loaned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeLoanError || !activeLoan) {
    throw new Error('Unable to locate the active loan record for this book.')
  }

  const normalizedLoanBorrower = activeLoan.borrower_name?.trim().toLowerCase()
  if (!normalizedLoanBorrower) {
    throw new Error('The active loan is missing borrower information. Please contact admin.')
  }

  // Allow match either by full identifier OR by username part before '@'.
  // This handles cases where one side uses the full email (arifah.hanafiah@...)
  // and the other side only stores the username (arifah.hanafiah).
  const requesterUsername = normalizedRequester.split('@')[0]
  const loanUsername = normalizedLoanBorrower.split('@')[0]

  const isSameBorrower =
    normalizedRequester === normalizedLoanBorrower ||
    requesterUsername === normalizedLoanBorrower ||
    normalizedRequester === loanUsername ||
    requesterUsername === loanUsername

  if (!isSameBorrower) {
    throw new Error(`Only ${activeLoan.borrower_name ?? 'the original borrower'} can return this book.`)
  }

  const returnedAt = new Date().toISOString()

  const { error: returnError } = await supabase
    .from('book_loans')
    .update({ loan_status: 'RETURNED', returned_at: returnedAt })
    .eq('id', activeLoan.id)

  if (returnError) {
    throw new Error(returnError.message)
  }

  const { error: copyResetError } = await supabase.from('book_copies').update({ status: 'AVAILABLE' }).eq('id', targetCopyId)
  if (copyResetError) {
    throw new Error(copyResetError.message)
  }

  return {
    mode: 'return',
    pickupDate: activeLoan.loaned_at ?? returnedAt,
    dueDate: activeLoan.due_at ?? returnedAt,
    message: 'Book returned successfully',
  }
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

export async function deleteBook(bookId: string): Promise<void> {
  if (!supabase) {
    console.info('Mock delete book', bookId)
    useLibraryAdminStore.getState().removeBook(bookId)
    return
  }

  // Delete book (cascade will delete copies and loans)
  const { error } = await supabase.from('books').delete().eq('id', bookId)

  if (error) {
    throw new Error(error.message)
  }

  // Remove from local store
  useLibraryAdminStore.getState().removeBook(bookId)
}

