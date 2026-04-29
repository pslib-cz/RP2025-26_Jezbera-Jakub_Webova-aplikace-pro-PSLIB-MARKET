import { describe, it, expect } from 'vitest'
import type { Book, Tag, BookReservation } from '../types/models'

describe('Book model', () => {
  const mockTag: Tag = {
    id: 1,
    name: 'Matematika',
    bgColor: '#ff0000',
    textColor: '#ffffff',
  }

  const mockBook: Book = {
    id: 1,
    title: 'Matematika pro SŠ',
    price: 150,
    ownerId: 'user-123',
    ownerName: 'Jan Novák',
    ownerEmail: 'jan@pslib.cz',
    condition: 1,
    saleStatus: 0,
    tags: [mockTag],
  }

  it('book has required fields', () => {
    expect(mockBook.id).toBe(1)
    expect(mockBook.title).toBe('Matematika pro SŠ')
    expect(mockBook.price).toBeGreaterThan(0)
    expect(mockBook.ownerId).toBeDefined()
  })

  it('book price is a positive number', () => {
    expect(mockBook.price).toBeGreaterThan(0)
    expect(typeof mockBook.price).toBe('number')
  })

  it('book can have optional description', () => {
    const bookWithDesc: Book = { ...mockBook, description: 'Popis knihy' }
    const bookWithoutDesc: Book = { ...mockBook }

    expect(bookWithDesc.description).toBe('Popis knihy')
    expect(bookWithoutDesc.description).toBeUndefined()
  })

  it('book tags array contains valid tags', () => {
    expect(mockBook.tags).toHaveLength(1)
    expect(mockBook.tags![0].name).toBe('Matematika')
    expect(mockBook.tags![0].bgColor).toMatch(/^#[0-9a-fA-F]{6}$/) 
  })

  it('book can have reservations', () => {
    const reservation: BookReservation = {
      id: 1,
      reservedByUserName: 'Petr Svoboda',
      reservedByUserEmail: 'petr@pslib.cz',
      reservedAt: '2026-04-28T10:00:00Z',
    }
    const reservedBook: Book = { ...mockBook, reservations: [reservation] }

    expect(reservedBook.reservations).toHaveLength(1)
    expect(reservedBook.reservations![0].reservedByUserEmail).toContain('@')
  })
})

describe('Tag model', () => {
  it('tag has all required color fields', () => {
    const tag: Tag = { id: 1, name: 'Fyzika', bgColor: '#0000ff', textColor: '#ffffff' }

    expect(tag.bgColor).toMatch(/^#/)
    expect(tag.textColor).toMatch(/^#/)
  })
})