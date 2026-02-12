import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue))
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error)
        }
    }, [key, storedValue])

    const addItem = useCallback((item) => {
        setStoredValue((prev) => [...prev, item])
    }, [])

    const updateItem = useCallback((id, updates, idField = 'id') => {
        setStoredValue((prev) =>
            prev.map((item) => (item[idField] === id ? { ...item, ...updates } : item))
        )
    }, [])

    const deleteItem = useCallback((id, idField = 'id') => {
        setStoredValue((prev) => prev.filter((item) => item[idField] !== id))
    }, [])

    const deleteItems = useCallback((ids, idField = 'id') => {
        setStoredValue((prev) => prev.filter((item) => !ids.includes(item[idField])))
    }, [])

    const resetData = useCallback((data) => {
        setStoredValue(data)
    }, [])

    return [storedValue, setStoredValue, { addItem, updateItem, deleteItem, deleteItems, resetData }]
}
