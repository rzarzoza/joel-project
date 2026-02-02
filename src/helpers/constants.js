export const LANGS = [
  'Arabic',
  'Chinese (Mandarin)',
  'Dutch',
  'English',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Spanish',
  'Swedish',
  'Turkish'
]

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const emailLink = (email) =>
  `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('SayHello · Language Exchange')}`

export const timeAgo = (ts) => {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export const initialForm = {
  id: '',
  name: '',
  email: '',
  native: '',
  practice: '',
  level: 'B1',
  availability: '',
  interests: '',
  bio: ''
}
