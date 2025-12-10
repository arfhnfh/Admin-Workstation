import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookPlus, Flame, Image as ImageIcon, Palette, Shapes } from 'lucide-react'
import classNames from 'classnames'
import { useLibraryAdminStore } from '@/store/libraryAdminStore'
import type { LibraryBook } from '@/types/library'
import {
  createBook,
  createCategory,
  fetchBookCategories,
  fetchLibraryOverview,
  uploadBookCover,
  updateBook,
} from '@/services/libraryService'
import { useAuthContext } from '@/hooks/useAuthContext'
import { isUserAdmin } from '@/services/staffService'

type Mode = 'category' | 'book'

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'borrowed', label: 'Not available' },
]

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'

export default function AddLibraryItemPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthContext()
  const categories = useLibraryAdminStore((state) => state.categories)
  const books = useLibraryAdminStore((state) => state.books)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [mode, setMode] = useState<Mode>('book')
  const [preview, setPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingBook, setSavingBook] = useState(false)

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'BookOpen',
    color: '#f4c9a8',
  })

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    categoryId: '',
    status: 'available',
    summary: '',
    coverColor: '#f7d6c4',
    timesBorrowed: 0,
    maxLoanDays: 14,
  })

  // Read mode from URL query parameter
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'category' || modeParam === 'book') {
      setMode(modeParam)
    }
  }, [searchParams])

  // If editing (bookId present), prefill form with existing book data
  useEffect(() => {
    const bookId = searchParams.get('bookId')
    if (!bookId) return

    const existing = (books as LibraryBook[]).find((b) => b.id === bookId)
    if (!existing) return

    setMode('book')
    setBookForm((prev) => ({
      ...prev,
      title: existing.title,
      author: existing.author,
      categoryId: existing.categoryId || prev.categoryId,
      status: existing.status,
      summary: existing.summary ?? '',
      coverColor: existing.coverColor ?? prev.coverColor,
      timesBorrowed: existing.stats?.timesBorrowed ?? prev.timesBorrowed,
      maxLoanDays: existing.maxLoanDays ?? prev.maxLoanDays,
    }))
    setPreview(existing.coverImage || null)
  }, [books, searchParams])

  useEffect(() => {
    if (categories.length && !bookForm.categoryId) {
      setBookForm((prev) => ({ ...prev, categoryId: categories[0].id }))
    }
  }, [categories, bookForm.categoryId])

  useEffect(() => {
    if (!categories.length) {
      fetchBookCategories().catch((error) => {
        setStatusMessage(error.message)
      })
    }
  }, [categories.length])

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        setCheckingRole(false)
        return
      }

      try {
        const admin = await isUserAdmin(user.id)
        setIsAdmin(admin)
      } catch {
        setIsAdmin(false)
      } finally {
        setCheckingRole(false)
      }
    }

    checkAdmin()
  }, [user])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPreview(null)
      setCoverFile(null)
      return
    }
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingCategory(true)
    setStatusMessage(null)
    try {
      const created = await createCategory(categoryForm)
      await fetchBookCategories()
      await fetchLibraryOverview()
      setStatusMessage(`Category “${created.name}” added.`)
      setCategoryForm({
        name: '',
        icon: 'BookOpen',
        color: '#f4c9a8',
      })
    } catch (error) {
      setStatusMessage((error as Error).message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleAddBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingBook(true)
    setStatusMessage(null)
    try {
      const coverUrl = coverFile ? await uploadBookCover(coverFile) : preview ?? DEFAULT_COVER
      const bookId = searchParams.get('bookId')

      const payload = {
        ...bookForm,
        coverUrl,
      }

      if (bookId) {
        const updated = await updateBook(bookId, payload)
        await fetchLibraryOverview()
        setStatusMessage(`Book “${updated.title}” has been updated.`)
      } else {
        const created = await createBook(payload)
        await fetchLibraryOverview()
        setStatusMessage(`Book “${created.title}” added to the shelf.`)
      }
      // Jika create baru, reset form. Kalau edit, kekalkan data.
      if (!bookId) {
        setBookForm({
          title: '',
          author: '',
          categoryId: categories[0]?.id ?? '',
          status: 'available',
          summary: '',
          coverColor: '#f7d6c4',
          timesBorrowed: 0,
          maxLoanDays: 14,
        })
        setPreview(null)
        setCoverFile(null)
      }
    } catch (error) {
      setStatusMessage((error as Error).message)
    } finally {
      setSavingBook(false)
    }
  }

  const hotBadgeVisible = useMemo(() => bookForm.timesBorrowed >= 10, [bookForm.timesBorrowed])

  return (
    <div className="space-y-8 rounded-3xl bg-white/90 p-6 shadow-card">
      {checkingRole ? (
        <div className="flex h-full min-h-[40vh] items-center justify-center">
          <div className="animate-pulse text-text-muted">Checking access…</div>
        </div>
      ) : !isAdmin ? (
        <div className="flex h-full min-h-[40vh] items-center justify-center">
          <div className="space-y-2 text-center">
            <p className="text-xl font-semibold text-charcoal">Access Denied</p>
            <p className="text-sm text-text-muted">
              You need admin privileges to access Manage Library.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to="/library" className="inline-flex items-center gap-2 text-sm text-brand.violet">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Link>
              <h1 className="mt-3 text-3xl font-semibold text-charcoal">Manage collection</h1>
              <p className="text-sm text-text-muted">
                Add new categories or slot in fresh titles with cover art, availability, and hot indicators.
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-brand.violet/40 px-4 py-2 text-sm font-semibold text-brand.violet"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 rounded-3xl bg-brand.sand/80 p-3">
            {(['book', 'category'] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={classNames(
                  'flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  mode === option ? 'bg-white shadow-card text-charcoal' : 'text-text-muted',
                )}
              >
                {option === 'book' ? <BookPlus className="h-4 w-4" /> : <Shapes className="h-4 w-4" />}
                {option === 'book' ? 'Book' : 'Category'}
              </button>
            ))}
          </div>

          {mode === 'category' ? (
        <form onSubmit={handleAddCategory} className="grid gap-6 rounded-3xl border border-card-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-brand.violet" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">New category</p>
              <h2 className="text-xl font-semibold">Group titles by theme</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-text-muted">
              Name
              <input
                required
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
                placeholder="Fantasy"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Icon keyword
              <input
                value={categoryForm.icon}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
                placeholder="Sparkles"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Accent color
              <input
                type="color"
                value={categoryForm.color}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, color: event.target.value }))}
                className="mt-1 h-12 w-full rounded-2xl border border-card-border bg-transparent px-4 py-3"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={savingCategory}
            className="rounded-2xl bg-[#8c4b2d] px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#6f361f] disabled:bg-[#8c4b2d]/60"
          >
            {savingCategory ? 'Saving...' : 'Save category'}
          </button>
        </form>
          ) : (
        <form onSubmit={handleAddBook} className="grid gap-6 rounded-3xl border border-card-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <BookPlus className="h-6 w-6 text-brand.violet" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">New book</p>
              <h2 className="text-xl font-semibold">Bring a new title onto the shelf</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-text-muted">
              Title
              <input
                required
                value={bookForm.title}
                onChange={(event) => setBookForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
                placeholder="The Midnight Library"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Author
              <input
                required
                value={bookForm.author}
                onChange={(event) => setBookForm((prev) => ({ ...prev, author: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
                placeholder="Matt Haig"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Category
              <select
                required
                value={bookForm.categoryId}
                onChange={(event) => setBookForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Availability
              <select
                value={bookForm.status}
                onChange={(event) => setBookForm((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Max loan days
              <input
                type="number"
                min={1}
                value={bookForm.maxLoanDays}
                onChange={(event) =>
                  setBookForm((prev) => ({ ...prev, maxLoanDays: Number(event.target.value) }))
                }
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Times borrowed
              <input
                type="number"
                min={0}
                value={bookForm.timesBorrowed}
                onChange={(event) =>
                  setBookForm((prev) => ({ ...prev, timesBorrowed: Number(event.target.value) }))
                }
                className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-text-muted">
              Cover accent
              <input
                type="color"
                value={bookForm.coverColor}
                onChange={(event) => setBookForm((prev) => ({ ...prev, coverColor: event.target.value }))}
                className="mt-1 h-12 w-full rounded-2xl border border-card-border bg-transparent px-4 py-3"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-text-muted">
            Short summary
            <textarea
              value={bookForm.summary}
              onChange={(event) => setBookForm((prev) => ({ ...prev, summary: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-card-border px-4 py-3 text-sm"
              rows={3}
              placeholder="Why is this book great for the team?"
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-sm font-semibold text-text-muted">
              Upload cover
              <div className="mt-2 rounded-3xl border border-dashed border-card-border p-6 text-center">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="cover-upload" />
                <label htmlFor="cover-upload" className="flex cursor-pointer flex-col items-center gap-2 text-sm text-text-muted">
                  <ImageIcon className="h-8 w-8 text-brand.violet" />
                  <span>Drop an image or click to browse</span>
                </label>
              </div>
            </label>
            <div className="rounded-3xl bg-brand.sand/80 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Shelf preview</p>
              <div className="relative mt-4 rounded-[28px] bg-white/90 p-4 shadow-pastel">
                <div
                  className="relative h-44 rounded-3xl shadow-2xl"
                  style={{
                    backgroundImage: `url(${preview ?? 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'})`,
                    backgroundImage: `url(${preview ?? DEFAULT_COVER})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: `0 30px 40px ${bookForm.coverColor}44`,
                  }}
                >
                  {hotBadgeVisible && (
                    <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand.violet">
                      <Flame className="h-3 w-3 text-orange-500" />
                      Hot pick
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-text-muted">{bookForm.author || 'Author name'}</p>
                  <h3 className="text-lg font-semibold">{bookForm.title || 'Book title'}</h3>
                </div>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingBook}
            className="rounded-2xl bg-[#8c4b2d] px-6 py-3 text-sm font-semibold text-white shadow-card disabled:opacity-60"
          >
            {savingBook ? 'Saving...' : 'Save book'}
          </button>
        </form>
          )}

          {statusMessage && (
            <div className="mt-4 rounded-2xl bg-brand.sand/80 px-4 py-3 text-center text-sm font-semibold text-brand.violet">
              {statusMessage}
            </div>
          )}
        </>
      )}
    </div>
  )
}

