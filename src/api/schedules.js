// API client for saved schedules
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getSchedule(term, token) {
    const response = await fetch(`${API_BASE}/api/schedules?term=${encodeURIComponent(term)}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch schedule');
    }

    return response.json();
}

export async function saveSchedule({ term, scheduleData, totalCredits }, token) {
    const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ term, scheduleData, totalCredits })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save schedule');
    }

    return response.json();
}

export async function deleteSchedule(term, token) {
    const response = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(term)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
    }

    return response.json();
}
