import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Crown,
  Ghost,
  Headphones,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  TabletSmartphone,
  Users,
  QrCode,
  Send,
  Trash2,
  BookPlus,
  Shapes,
  Pencil,
} from 'lucide-react'
import classNames from 'classnames'
import type { BookCategory, LibraryBook, LibraryLeaderboardEntry, LibraryChatMessage } from '@/types/library'
import {
  fetchLibraryOverview,
  type LibraryOverview,
  createBookLoan,
  sendChatMessage,
  scanBookQrCode,
  type ScanResult,
  deleteBook,
} from '@/services/libraryService'
import { isHotBook, useLibraryAdminStore } from '@/store/libraryAdminStore'
import { leaderboard as mockLeaderboard } from '@/data/mockLibrary'
import { useAuthContext } from '@/hooks/useAuthContext'

function formatBorrowerDisplay(name?: string | null) {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  if (trimmed.includes('@')) {
    return trimmed.split('@')[0]
  }
  return trimmed
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TabletSmartphone,
  Sparkles,
  Crown,
  Headphones,
  BookOpen,
  Heart,
  Ghost,
  default: Sparkles,
}

function CategoryPills({
  categories,
  active,
  onSelect,
}: {
  categories: BookCategory[]
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => {
        const Icon = categoryIcons[category.icon] ?? categoryIcons.default
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={classNames(
              'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition',
              active === category.id ? 'bg-white shadow-card' : 'bg-white/60 text-text-muted',
            )}
            style={{ borderColor: category.color, borderWidth: 1, borderStyle: 'solid' }}
          >
            <Icon className="h-4 w-4" />
            {category.name}
          </button>
        )
      })}
    </div>
  )
}

function BookCard({
  book,
  isAdmin,
  isStaff,
  onLoanSaved,
  onBorrowRequest,
  borrowerName,
  borrowerIdentifier,
  onNavigateBack,
}: {
  book: LibraryBook
  isAdmin: boolean
  isStaff: boolean
  onLoanSaved: () => void
  onBorrowRequest: (book: LibraryBook) => void
  borrowerName: string
  borrowerIdentifier?: string
  onNavigateBack?: () => void
}) {
  const navigate = useNavigate()
  const statusClass =
    book.status === 'available'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700'

  const [borrower, setBorrower] = useState(book.borrowerName ?? '')
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scanSuccessInfo, setScanSuccessInfo] = useState<ScanResult | null>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerActiveRef = useRef(false)
  const [scanMode, setScanMode] = useState<'borrow' | 'return'>('borrow')
  const scannerElementId = useMemo(() => `qr-reader-${book.id}`, [book.id])
  const applyScannerStyles = useCallback(() => {
    const host = document.getElementById(scannerElementId)
    if (!host) return
    const targets = host.querySelectorAll('video, canvas')
    targets.forEach((node) => {
      const el = node as HTMLElement
      el.style.width = '100%'
      el.style.height = '100%'
      el.style.objectFit = 'cover'
      el.style.borderRadius = '24px'
      el.style.display = 'block'
    })
  }, [scannerElementId])

  const handlePickupChange = (value: string) => {
    setPickupDate(value)
    if (value && book.maxLoanDays) {
      const due = new Date(value)
      due.setDate(due.getDate() + book.maxLoanDays)
      setReturnDate(due.toISOString().split('T')[0])
    }
  }

  const handleAdminUpdate = async () => {
    if (!borrower || !pickupDate || !returnDate) return
    setIsSaving(true)
    try {
      await createBookLoan({
        bookId: book.id,
        copyId: book.copyId,
        borrowerName: borrower,
        pickupDate,
        returnDate,
      })
      setBorrower('')
      setPickupDate('')
      setReturnDate('')
      onLoanSaved()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBorrowMe = () => {
    onBorrowRequest(book)
  }

  useEffect(() => {
    if (scanSuccessInfo) {
      const timer = setTimeout(() => {
        setScanSuccessInfo(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [scanSuccessInfo])

  const processQrValue = useCallback(
    async (qrValue: string) => {
      if (isProcessingScan) return
      setIsProcessingScan(true)
      setScannerError(null)
      try {
        // Clean and normalize QR code value
        let cleanedValue = qrValue.trim()

        // Remove any whitespace, newlines, or special characters that might come from scanner
        // Keep alphanumeric, hyphens, and colons (for book: format)
        cleanedValue = cleanedValue.replace(/\s+/g, '').replace(/[^a-zA-Z0-9:-]/g, '')

        // Handle different QR code formats
        let bookId: string | null = null

        // Format 1: book:${bookId}
        if (cleanedValue.startsWith('book:')) {
          bookId = cleanedValue.replace('book:', '').trim()
        }
        // Format 2: Just the book ID (UUID)
        else if (cleanedValue.length === 36 && cleanedValue.includes('-')) {
          // Looks like a UUID
          bookId = cleanedValue
        }
        // Format 3: Try to extract from URL or other formats
        else {
          // Try to find book: pattern anywhere in the string
          const bookMatch = cleanedValue.match(/book:([a-f0-9-]+)/i)
          if (bookMatch) {
            bookId = bookMatch[1]
          }
        }

        if (!bookId) {
          alert('Invalid QR code format. Please scan a valid book QR code.\n\nExpected format: book:BOOK_ID')
          return
        }

        // Check if scanned book ID matches current book
        if (bookId === book.id) {
          const result = await scanBookQrCode(book.id, borrowerName, book.copyId, scanMode)
          if (result) {
            setScanSuccessInfo(result)
            setTimeout(() => {
              setShowQrScanner(false)
            }, 600)
            // Navigate back to library page after 1 second
            setTimeout(() => {
              onLoanSaved()
              if (onNavigateBack) {
                onNavigateBack()
              }
            }, 1000)
          } else {
            onLoanSaved()
          }
        } else {
          alert(`QR code does not match this book.\n\nScanned: ${bookId}\nExpected: ${book.id}\n\nPlease scan the correct book.`)
        }
      } catch (error: any) {
        console.error('Error scanning QR code:', error)
        const errorMessage = error?.message || 'Failed to process QR code. Please try again.'
        setScannerError(errorMessage)
        alert(`Error: ${errorMessage}`)
      } finally {
        setIsProcessingScan(false)
      }
    },
    [book.copyId, book.id, isProcessingScan, onLoanSaved, borrowerName, scanMode],
  )

  useEffect(() => {
    const stopScanner = () => {
      if (html5QrCodeRef.current && scannerActiveRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch((error) => console.info('Scanner already stopped', error?.message))
          .finally(() => {
            html5QrCodeRef.current = null
            scannerActiveRef.current = false
          })
      } else {
        html5QrCodeRef.current = null
        scannerActiveRef.current = false
      }
    }

    if (!showQrScanner) {
      stopScanner()
      return
    }

    if (typeof window === 'undefined') return
    const element = document.getElementById(scannerElementId)
    if (!element) return

    const qrScanner = new Html5Qrcode(scannerElementId, { verbose: false })
    html5QrCodeRef.current = qrScanner

    qrScanner
      .start(
        { facingMode: 'environment' as const },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          processQrValue(decodedText)
        },
        (error) => {
          console.info('QR scan attempt', error)
        },
      )
      .then(() => {
        scannerActiveRef.current = true
        requestAnimationFrame(applyScannerStyles)
      })
      .catch((error) => {
        console.error('Failed to start QR scanner', error)
        setScannerError(error?.message ?? 'Unable to access camera. Please allow permission.')
        scannerActiveRef.current = false
      })

    return () => {
      if (scannerActiveRef.current) {
        qrScanner
          .stop()
          .then(() => qrScanner.clear())
          .catch((error) => console.info('Scanner already stopped', error?.message))
      }
      html5QrCodeRef.current = null
      scannerActiveRef.current = false
    }
  }, [applyScannerStyles, processQrValue, scannerElementId, showQrScanner])

  const handleQrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    if (value && value.length > 0) {
      // Small delay to ensure full value is captured
      setTimeout(() => {
        processQrValue(value)
        e.target.value = '' // Clear input
      }, 100)
    }
  }

  const handleQrInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim()
      if (value) {
        processQrValue(value)
        e.currentTarget.value = '' // Clear input
      }
    }
  }

  const handleDeleteBook = async () => {
    if (!confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      return
    }
    try {
      await deleteBook(book.id)
      onLoanSaved()
    } catch (error) {
      console.error('Failed to delete book:', error)
      alert('Failed to delete book. Please try again.')
    }
  }

  const handleEditBook = () => {
    navigate(`/library/collection?mode=book&bookId=${book.id}`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-card-border bg-white/90 p-5 shadow-card">
      <div
        className="relative h-44 rounded-3xl bg-cover bg-center shadow-2xl"
        style={{
          backgroundImage: `url(${book.coverImage})`,
          boxShadow: `0 25px 35px ${book.coverColor}55`,
        }}
      >
        {isHotBook(book.stats.timesBorrowed) && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-orange-500 shadow-card">
            🔥 Hot
          </span>
        )}
        {isAdmin && (
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditBook}
              className="flex items-center justify-center rounded-full bg-white/90 p-2 text-charcoal shadow-lg transition hover:bg-brand.sand/80"
              title="Edit book"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDeleteBook}
              className="flex items-center justify-center rounded-full bg-red-500 p-2 text-white shadow-lg transition hover:bg-red-600"
              title="Delete book"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-text-muted">{book.author}</p>
        <h3 className="text-xl font-semibold">{book.title}</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Users className="h-4 w-4" />
          {book.borrowerName ? `Borrowed by ${formatBorrowerDisplay(book.borrowerName)}` : 'Available for pickup'}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {book.status === 'available' ? 'Available' : 'Not available'}
        </span>
      </div>

      <p className="text-xs font-semibold text-text-muted">Max loan: {book.maxLoanDays} days</p>

      <div className="flex items-center gap-1 text-xs text-text-muted">
        <Sparkles className="h-4 w-4 text-brand.violet" />
        Popular • Borrowed {book.stats.timesBorrowed}x • Rating {book.stats.rating.toFixed(1)}
      </div>

      {book.dueDate && (
        <div className="flex items-center gap-2 rounded-2xl bg-brand.violet/5 px-3 py-2 text-sm text-brand.violet">
          <CalendarCheck className="h-4 w-4" />
          Due {new Date(book.dueDate).toLocaleDateString()}
        </div>
      )}

      {/* Borrow Me button - Only for staff (not admin) */}
      {isStaff && !isAdmin && book.status === 'available' && (
        <button
          type="button"
          onClick={handleBorrowMe}
          className="w-full rounded-2xl bg-[#cb7341] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-[#a6592f]"
        >
          Borrow Me
        </button>
      )}

      {/* Scan QR button - Only for staff (not admin) */}
      {isStaff && !isAdmin && (
        <button
          type="button"
          onClick={() => {
            setScanMode('borrow')
            setShowQrScanner(true)
            setTimeout(() => qrInputRef.current?.focus(), 100)
          }}
          disabled={!borrowerIdentifier}
          className={classNames(
            'w-full flex items-center justify-center gap-2 rounded-2xl border border-brand.violet/40 px-4 py-2 text-sm font-semibold transition',
            borrowerIdentifier
              ? 'text-brand.violet hover:bg-brand.violet/5'
              : 'text-text-muted opacity-60 cursor-not-allowed',
          )}
        >
          <QrCode className="h-4 w-4" />
          Scan QR Code
        </button>
      )}

      {/* Return button */}
      {isStaff && !isAdmin && book.status !== 'available' && (
        <button
          type="button"
          onClick={() => {
            setScanMode('return')
            setShowQrScanner(true)
            setTimeout(() => qrInputRef.current?.focus(), 100)
          }}
          disabled={!borrowerIdentifier}
          className={classNames(
            'w-full rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-card transition',
            borrowerIdentifier ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed',
          )}
        >
          Return Book
        </button>
      )}

      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Scan QR Code</p>
                <h4 className="text-lg font-semibold">Borrow {book.title}</h4>
                <p className="text-xs text-text-muted">
                  Point your camera towards the book QR or paste the code manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrScanner(false)}
                className="rounded-full bg-gray-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-600"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="overflow-hidden rounded-3xl border border-card-border bg-black/90">
                <div id={scannerElementId} className="aspect-square w-full" />
              </div>
              <div className="rounded-3xl bg-brand.sand/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Manual entry</p>
                <p className="mb-3 text-xs text-text-muted">
                  Having trouble with the camera? Paste the code instead.
                </p>
                {scanSuccessInfo && (
                  <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <p className="font-semibold">
                      {scanSuccessInfo.mode === 'return' ? 'Book returned!' : 'Loan recorded'}
                    </p>
                    {scanSuccessInfo.pickupDate && (
                      <p>
                        {scanSuccessInfo.mode === 'return' ? 'Loaned at' : 'Start'}:{' '}
                        {new Date(scanSuccessInfo.pickupDate).toLocaleString()}
                      </p>
                    )}
                    {scanSuccessInfo.dueDate && (
                      <p>
                        {scanSuccessInfo.mode === 'return' ? 'Was due' : 'Due'}:{' '}
                        {new Date(scanSuccessInfo.dueDate).toLocaleString()}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-700">
                      {scanSuccessInfo.mode === 'return'
                        ? 'You can close this window now. Thank you for returning the book!'
                        : 'You can close this window once you acknowledge the dates.'}
                    </p>
                  </div>
                )}
                {scannerError && <p className="mb-3 text-xs font-semibold text-rose-600">{scannerError}</p>}
                <input
                  ref={qrInputRef}
                  type="text"
                  className="w-full rounded-2xl border border-card-border px-3 py-2 text-sm"
                  placeholder="book:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  onChange={handleQrInputChange}
                  onKeyPress={handleQrInputKeyPress}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowQrScanner(false)}
                  className="mt-3 w-full rounded-2xl bg-gray-400 py-2 text-xs font-semibold text-white transition hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl bg-brand.sand/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Admin Assignment
          </p>
          <div className="grid gap-3">
            <input
              className="w-full rounded-2xl border border-card-border px-3 py-2 text-sm"
              placeholder="Borrower name"
              value={borrower}
              onChange={(event) => setBorrower(event.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                className="w-full rounded-2xl border border-card-border px-3 py-2 text-sm"
              value={pickupDate}
              onChange={(event) => handlePickupChange(event.target.value)}
              />
              <input
                type="date"
                className="w-full rounded-2xl border border-card-border px-3 py-2 text-sm"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleAdminUpdate}
              className="w-full rounded-2xl bg-[#8c4b2d] py-2 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f]"
            >
              {isSaving ? 'Saving...' : 'Save booking'}
            </button>
            <button
              type="button"
              onClick={() => setShowLog(true)}
              className="w-full rounded-2xl bg-blue-500 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-blue-600"
            >
              View log
            </button>
          </div>
        </div>
      )}

      {showLog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Loan history</p>
                <h4 className="text-lg font-semibold">{book.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLog(false)}
                className="rounded-full bg-gray-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-gray-600"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
              {/* Loan Records - Left Side (Large Message Box) */}
              <div className="max-h-[600px] min-h-[400px] space-y-3 overflow-y-auto rounded-2xl border border-card-border p-4">
                {book.loans.length === 0 && (
                  <p className="text-sm text-text-muted">No loan records yet for this book.</p>
                )}
                {book.loans.map((loan) => (
                  <div key={loan.id} className="rounded-2xl border border-card-border bg-brand.sand/30 p-4 text-sm">
                    <p className="font-semibold text-charcoal">{formatBorrowerDisplay(loan.borrowerName)}</p>
                    <p className="mt-1 text-xs text-text-muted">Status: {loan.loanStatus}</p>
                    <p className="text-xs text-text-muted">
                      Loaned: {loan.loanedAt ? new Date(loan.loanedAt).toLocaleDateString() : '-'}
                    </p>
                    <p className="text-xs text-text-muted">
                      Due: {loan.dueAt ? new Date(loan.dueAt).toLocaleDateString() : '-'}
                    </p>
                    {loan.returnedAt && (
                      <p className="text-xs text-text-muted">
                        Returned: {new Date(loan.returnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {/* QR Code - Right Side */}
              {book.qrCodeUrl && (
                <div className="flex flex-col items-center justify-start">
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text-muted">QR Code</p>
                  <img src={book.qrCodeUrl} alt={`${book.title} QR`} className="h-48 w-48 rounded-2xl border border-card-border p-2" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Leaderboard({ data }: { data: LibraryLeaderboardEntry[] }) {
  const podium = data.slice(0, 3)
  const rest = data.slice(3)
  return (
    <div className="rounded-3xl border border-card-border bg-white/80 p-6 shadow-card">
      <h3 className="text-lg font-semibold">Leaderboard</h3>
      <p className="text-sm text-text-muted">Top borrowers this quarter</p>
      <div className="mt-6 flex items-end justify-between gap-4">
        {podium.map((entry, index) => (
          <div
            key={entry.staffId}
            className={classNames(
              'flex-1 rounded-3xl p-4 text-center',
              index === 0 ? 'bg-brand.violet/10' : 'bg-brand.sand/50',
            )}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">#{index + 1}</p>
            <img
              src={entry.avatar}
              alt={entry.name}
              className="mx-auto my-2 h-14 w-14 rounded-full object-cover"
            />
            <p className="text-sm font-semibold">{entry.name}</p>
            <p className="text-xs text-text-muted">{entry.borrowedCount} books</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {rest.map((entry, index) => (
          <div key={entry.staffId} className="flex items-center justify-between rounded-2xl bg-brand.sand/60 px-4 py-2">
            <span className="text-sm font-semibold">
              #{index + 4} {entry.name}
            </span>
            <span className="text-sm text-brand.violet">{entry.borrowedCount} books</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatPanel({
  overview,
  chats,
  onSendMessage,
  role,
  onAutoReply,
}: {
  overview: LibraryOverview | null
  chats: LibraryChatMessage[]
  onSendMessage: (message: string) => void
  role: 'staff' | 'admin'
  onAutoReply?: () => void
}) {
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const allChats = chats.length > 0 ? chats : overview?.chats ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allChats])

  const handleSend = () => {
    const trimmed = messageInput.trim()
    if (!trimmed) return

    // Send staff message first
    if (role === 'staff') {
      onSendMessage(trimmed)
      
      // Auto-reply untuk soalan staff (from support/admin)
      const isQuestion = 
        trimmed.includes('?') || 
        trimmed.toLowerCase().includes('how') || 
        trimmed.toLowerCase().includes('what') || 
        trimmed.toLowerCase().includes('when') || 
        trimmed.toLowerCase().includes('where') || 
        trimmed.toLowerCase().includes('why') ||
        trimmed.toLowerCase().includes('can i') ||
        trimmed.toLowerCase().includes('where is') ||
        trimmed.toLowerCase().includes('when can')
      
      if (isQuestion && onAutoReply) {
        setTimeout(() => {
          onAutoReply()
        }, 800)
      }
    } else {
      // Admin boleh send message biasa
      onSendMessage(trimmed)
    }

    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-card-border bg-white/90 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Support</p>
          <h3 className="text-xl font-semibold">Privacy & Support</h3>
        </div>
        <MessageCircle className="h-6 w-6 text-brand.violet" />
      </div>
      <div ref={chatContainerRef} className="mt-4 flex-1 space-y-4 overflow-y-auto">
        {allChats.map((msg) => {
          const isStaff = msg.sender === 'staff'
          return (
            <div
              key={msg.id}
              className={classNames(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-card selection:bg-brand.violet/30 selection:text-charcoal',
                isStaff
                  ? 'ml-auto bg-brand.violet/10 border border-brand.violet/40 text-charcoal'
                  : 'bg-white border border-gray-200 text-charcoal',
              )}
            >
              {msg.message}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-2xl border border-card-border px-3 py-2 text-sm"
          placeholder="Write a message…"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          onClick={handleSend}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  )
}

export default function LibraryHubPage() {
  const { user } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Derive role from route:
  // - `/library`        => staff view (scan & borrow)
  // - `/library/manage` => admin view (log, manual assign, delete)
  const isAdminView = location.pathname.includes('/library/manage')
  const role: 'staff' | 'admin' = isAdminView ? 'admin' : 'staff'
  const localCategories = useLibraryAdminStore((state) => state.categories)
  const localBooks = useLibraryAdminStore((state) => state.books)
  const [overview, setOverview] = useState<LibraryOverview | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [chats, setChats] = useState<LibraryChatMessage[]>([])

  const refreshOverview = () =>
    fetchLibraryOverview()
      .then((data) => {
        setOverview(data)
        if (chats.length === 0) {
          setChats(data.chats)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch library overview:', error)
      })

  useEffect(() => {
    refreshOverview()
  }, [location.pathname])

  const handleBorrowRequest = async (book: LibraryBook) => {
    const staffName = formatBorrowerDisplay(user?.email ?? 'Staff')
    const statusText = book.status === 'available' ? 'Available' : 'Not Available'
    let message = `📚 Book Request\n\nTitle: ${book.title}\nAuthor: ${book.author}\nStatus: ${statusText}`

    if (book.status === 'borrowed' && book.borrowerName && book.dueDate) {
      const loanStart = book.loans.find((l) => l.loanStatus === 'ON_LOAN')?.loanedAt
      message += `\n\n⚠️ This book is currently borrowed by "${formatBorrowerDisplay(book.borrowerName)}"\nLoan Period: ${
        loanStart ? new Date(loanStart).toLocaleDateString() : 'N/A'
      } - ${new Date(book.dueDate).toLocaleDateString()}`
    } else {
      message += `\n\n✅ Ready for pickup at Admin counter.`
    }

    // Send message from support (admin) - auto message
    const supportMessage: LibraryChatMessage = {
      id: `support-${Date.now()}`,
      sender: 'support',
      message,
      timestamp: new Date().toISOString(),
    }

    setChats((prev) => [...prev, supportMessage])
    await sendChatMessage(supportMessage)
  }

  const handleSendChatMessage = (message: string) => {
    const newMessage: LibraryChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: role === 'admin' ? 'support' : 'staff',
      message,
      timestamp: new Date().toISOString(),
    }
    setChats((prev) => [...prev, newMessage])
    sendChatMessage(newMessage).catch((error) => {
      console.error('Failed to send chat message:', error)
    })
  }

  const handleAutoReply = () => {
    const autoReplyMessage: LibraryChatMessage = {
      id: `auto-reply-${Date.now()}`,
      sender: 'support',
      message: 'Please refer Admin, Thank You !',
      timestamp: new Date().toISOString(),
    }
    setChats((prev) => [...prev, autoReplyMessage])
    sendChatMessage(autoReplyMessage).catch((error) => {
      console.error('Failed to send auto-reply:', error)
    })
  }

  const categories = overview?.categories ?? localCategories
  const books = overview?.books ?? localBooks

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory
        ? book.categoryId === activeCategory
        : true
      return matchesSearch && matchesCategory
    })
  }, [books, searchTerm, activeCategory])

  const currentBorrowerIdentifier = user?.email?.trim().toLowerCase() ?? ''

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white/90 p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="text-sm text-text-muted">
              Library / <span className="text-brand.violet">One Stop Center</span>
            </nav>
            <h1 className="mt-1 text-3xl font-semibold text-charcoal">Library Hub</h1>
            <p className="text-sm text-text-muted">
              Borrow, return and monitor every book from one delightful interface.
            </p>
          </div>
          {isAdminView && (
            <div className="flex items-center gap-3">
              <Link
                to="/library/collection?mode=category"
                className="flex items-center gap-2 rounded-xl bg-brand.violet/10 px-4 py-2 text-sm font-semibold text-brand.violet transition hover:bg-brand.violet/20"
              >
                <Shapes className="h-4 w-4" />
                Create Category
              </Link>
              <Link
                to="/library/collection?mode=book"
                className="flex items-center gap-2 rounded-xl bg-[#8c4b2d] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f]"
              >
                <BookPlus className="h-4 w-4" />
                Create Book
              </Link>
            </div>
          )}
        </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-3xl bg-brand.sand/60 p-4">
          <div className="flex flex-1 items-center gap-2 rounded-3xl bg-white px-4 py-2 shadow-inner">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              className="flex-1 border-none bg-transparent text-sm outline-none"
              placeholder="Search for books"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 rounded-3xl bg-[#8c4b2d] px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f]">
            Search
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {categories.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <CategoryPills
              categories={categories}
              active={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white/90 p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Popular</p>
                <h2 className="text-2xl font-semibold">Trending among staff</h2>
              </div>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</button>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-2">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isAdmin={role === 'admin'}
                  isStaff={role === 'staff'}
                  onLoanSaved={refreshOverview}
                  onBorrowRequest={handleBorrowRequest}
                  borrowerName={currentBorrowerIdentifier || user?.email || 'staff@unknown.local'}
                  borrowerIdentifier={currentBorrowerIdentifier}
                  onNavigateBack={() => navigate('/library')}
                />
              ))}
              {!filteredBooks.length && (
                <p className="col-span-full rounded-3xl bg-brand.sand/60 p-6 text-center text-text-muted">
                  No books match your filters yet.
                </p>
              )}
            </div>
          </div>
          <Leaderboard data={overview?.leaderboard ?? mockLeaderboard} />
        </div>
        <ChatPanel
          overview={overview}
          chats={chats}
          onSendMessage={handleSendChatMessage}
          role={role}
          onAutoReply={handleAutoReply}
        />
      </div>
    </div>
  )
}

