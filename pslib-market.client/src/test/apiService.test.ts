import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getBooks,
  getMyBooks,
  getTags,
//   getPendingBooks,
  changeBookSaleStatus,
  approveBook,
  rejectBook,
  reserveBook,
  createTag,
  deleteTag,
} from '../services/apiService'
import type { Book, Tag } from '../types/models'

// ─── Setup ──────────────────────────────────────────────────────────
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockBook: Book = {
  id: 1,
  title: 'Matematika pro SŠ',
  price: 150,
  ownerId: 'user-abc',
  ownerName: 'Jan Novák',
  ownerEmail: 'jan@pslib.cz',
  condition: 0,
  saleStatus: 0,
}

const mockTag: Tag = {
  id: 1,
  name: 'Matematika',
  bgColor: '#ff0000',
  textColor: '#ffffff',
}

const TOKEN = 'fake-jwt-token'

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── getBooks ────────────────────────────────────────────────────────
describe('getBooks', () => {
  it('vrátí seznam knih při úspěšném response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockBook],
        filteredCount: 1,
        visibleCount: 1,
        minPrice: 150,
        maxPrice: 150,
        page: 1,
        pageSize: 12,
      }),
    })

    const books = await getBooks({ token: TOKEN, page: 1, pageSize: 12 })

    expect(books.items).toHaveLength(1)
    expect(books.items[0].title).toBe('Matematika pro SŠ')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    )
  })

  it('funguje i bez tokenu (veřejný endpoint)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        filteredCount: 0,
        visibleCount: 0,
        minPrice: 0,
        maxPrice: 0,
        page: 1,
        pageSize: 12,
      }),
    })

    const books = await getBooks({ page: 1, pageSize: 12 })
    expect(books.items).toHaveLength(0)
  })

  it('vyhodí chybu při neúspěšném response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    await expect(getBooks({ token: TOKEN, page: 1, pageSize: 12 })).rejects.toThrow()
  })
})

// ─── getMyBooks ──────────────────────────────────────────────────────
describe('getMyBooks', () => {
  it('volá správný endpoint /books/my', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBook],
    })

    await getMyBooks(TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/my'),
      expect.anything()
    )
  })

  it('vyhodí chybu při 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    await expect(getMyBooks(TOKEN)).rejects.toThrow()
  })
})

// ─── getTags ─────────────────────────────────────────────────────────
describe('getTags', () => {
  it('vrátí seznam tagů', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockTag],
    })

    const tags = await getTags()

    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Matematika')
  })

  it('vyhodí chybu při selhání', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    await expect(getTags()).rejects.toThrow()
  })
})

// ─── changeBookSaleStatus ────────────────────────────────────────────
describe('changeBookSaleStatus', () => {
  it('volá PATCH na správný endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await changeBookSaleStatus(1, 2, TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/1/status'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('vyhodí chybu při selhání', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    await expect(changeBookSaleStatus(1, 2, TOKEN)).rejects.toThrow()
  })
})

// ─── approveBook / rejectBook ────────────────────────────────────────
describe('approveBook', () => {
  it('volá PATCH /books/:id/approve', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await approveBook(5, TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/5/approve'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('vyhodí chybu s textem z response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Kniha již byla schválena',
    })

    await expect(approveBook(5, TOKEN)).rejects.toThrow('Kniha již byla schválena')
  })
})

describe('rejectBook', () => {
  it('volá PATCH /books/:id/reject', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await rejectBook(3, TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/3/reject'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

// ─── reserveBook ─────────────────────────────────────────────────────
describe('reserveBook', () => {
  it('volá POST /books/:id/reserve', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await reserveBook(7, TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/books/7/reserve'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('vyhodí chybu pokud je kniha již rezervovaná', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Kniha je již rezervována',
    })

    await expect(reserveBook(7, TOKEN)).rejects.toThrow('Kniha je již rezervována')
  })
})

// ─── createTag ───────────────────────────────────────────────────────
describe('createTag', () => {
  it('posílá správná data jako JSON', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const tagData = { name: 'Chemie', bgColor: '#00ff00', textColor: '#000000' }
    await createTag(tagData, TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tags'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(tagData),
      })
    )
  })
})

// ─── deleteTag ───────────────────────────────────────────────────────
describe('deleteTag', () => {
  it('volá DELETE na endpoint s URL-enkódovaným názvem', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await deleteTag('Technické kreslení', TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Technické kreslení')),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})