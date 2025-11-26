import type {
  BookCategory,
  LibraryBook,
  LibraryChatMessage,
  LibraryLeaderboardEntry,
} from '@/types/library'

export const libraryCategories: BookCategory[] = [
  { id: 'ebooks', name: 'eBooks', icon: 'TabletSmartphone', color: '#fbc9a8' },
  { id: 'new', name: 'New', icon: 'Sparkles', color: '#fcd8e1' },
  { id: 'bestseller', name: 'Bestsellers', icon: 'Crown', color: '#ffe6a7' },
  { id: 'audiobooks', name: 'Audiobooks', icon: 'Headphones', color: '#d3f4ff' },
  { id: 'fiction', name: 'Fiction', icon: 'BookOpen', color: '#d4ccff' },
  { id: 'romance', name: 'Romance', icon: 'Heart', color: '#ffc6cf' },
  { id: 'fantasy', name: 'Fantasy', icon: 'Sparkles', color: '#e4ebff' },
  { id: 'horror', name: 'Horror', icon: 'Ghost', color: '#f9e3ff' },
]

export const popularBooks: LibraryBook[] = [
  {
    id: 'fairy-tale',
    title: 'Fairy Tale',
    author: 'Stephen King',
    categoryId: 'fantasy',
    coverImage:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80',
    coverColor: '#f7d6c4',
    borrowerName: 'Nor Aisyah',
    borrowerAvatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    status: 'borrowed',
    dueDate: '2025-11-25',
    summary: 'An enchanting journey that blends dark fantasy with heartfelt adventure.',
    maxLoanDays: 14,
    qrCodeUrl: null,
    loans: [],
    stats: {
      timesBorrowed: 8,
      rating: 4.8,
    },
  },
  {
    id: 'never-after',
    title: 'Never After',
    author: 'Stephanie Garber',
    categoryId: 'romance',
    coverImage:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80',
    coverColor: '#fce1ce',
    borrowerName: null,
    status: 'available',
    summary: 'A whimsical tale filled with romance, secrets, and magical intrigue.',
    maxLoanDays: 14,
    qrCodeUrl: null,
    loans: [],
    stats: {
      timesBorrowed: 5,
      rating: 4.6,
    },
  },
  {
    id: 'klara-and-the-sun',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    categoryId: 'fiction',
    coverImage:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    coverColor: '#fdd2c2',
    borrowerName: 'Azri Rahman',
    borrowerAvatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    status: 'borrowed',
    dueDate: '2025-11-28',
    summary: 'Sci-fi reflection on love and humanity through the eyes of an AI companion.',
    maxLoanDays: 14,
    qrCodeUrl: null,
    loans: [],
    stats: {
      timesBorrowed: 11,
      rating: 4.7,
    },
  },
  {
    id: 'nisit-and-fury',
    title: 'Mist and Fury',
    author: 'Sarah J Maas',
    categoryId: 'fantasy',
    coverImage:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80',
    coverColor: '#f7d4d6',
    borrowerName: null,
    status: 'available',
    summary: 'High fantasy sequel packed with political intrigue and slow-burn romance.',
    maxLoanDays: 14,
    qrCodeUrl: null,
    loans: [],
    stats: {
      timesBorrowed: 9,
      rating: 4.9,
    },
  },
  {
    id: 'hamnet',
    title: 'Hamnet',
    author: 'Maggie O’Farrell',
    categoryId: 'fiction',
    coverImage:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80',
    coverColor: '#f8e0c7',
    borrowerName: 'Fatin Hanisah',
    borrowerAvatar:
      'https://images.unsplash.com/photo-1546539782-6fc531453083?auto=format&fit=crop&w=200&q=80',
    status: 'borrowed',
    dueDate: '2025-11-22',
    summary: 'Historical fiction exploring love and loss behind Shakespeare’s greatest work.',
    maxLoanDays: 14,
    qrCodeUrl: null,
    loans: [],
    stats: {
      timesBorrowed: 7,
      rating: 4.5,
    },
  },
]

export const leaderboard: LibraryLeaderboardEntry[] = [
  {
    staffId: 'aiman',
    name: 'Aiman Fahmi',
    avatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    borrowedCount: 18,
  },
  {
    staffId: 'hamiduddin',
    name: 'Hamiduddin',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    borrowedCount: 14,
  },
  {
    staffId: 'aisyah',
    name: 'Nor Aisyah',
    avatar:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
    borrowedCount: 12,
  },
  {
    staffId: 'taufiq',
    name: 'Taufiq Iskandar',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    borrowedCount: 9,
  },
  {
    staffId: 'hani',
    name: 'Hani Zahra',
    avatar:
      'https://images.unsplash.com/photo-1583001773435-2f322f0ef27e?auto=format&fit=crop&w=200&q=80',
    borrowedCount: 8,
  },
]

export const chatMessages: LibraryChatMessage[] = [
  {
    id: '1',
    sender: 'support',
    message: 'Good day! We have 3 popular gift editions of the Harry Potter books.',
    timestamp: '2025-11-19T10:02:00+08:00',
  },
  {
    id: '2',
    sender: 'staff',
    message: 'I am looking for the gift editions of Harry Potter. Do you have them?',
    timestamp: '2025-11-19T10:05:00+08:00',
  },
  {
    id: '3',
    sender: 'support',
    message: 'Yes! Which cover do you like? I can add it to your cart immediately.',
    timestamp: '2025-11-19T10:06:00+08:00',
  },
  {
    id: '4',
    sender: 'staff',
    message: 'The middle one is perfect. Can you reserve it for pickup on Friday?',
    timestamp: '2025-11-19T10:07:00+08:00',
  },
]

