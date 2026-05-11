import { useState, useCallback, useEffect, useRef } from 'react'

let _addToast = null

export function useToast() {
  const addToast = useCallback((msg, type = 'success') => {
    if (_addToast) _addToast(msg, type)
  }, [])
  return { toast: addToast }
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    _addToast = (msg, type) => {
      const id = ++idRef.current
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    }
    return () => { _addToast = null }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.type === 'error' ? ' toast-error' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
