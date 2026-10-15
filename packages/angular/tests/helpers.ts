import { vi } from 'vitest'

export function mockOnLine(online: boolean) {
  vi.spyOn(Navigator.prototype, 'onLine', 'get').mockReturnValue(online)
}

export function setNetwork(online: boolean) {
  mockOnLine(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}
