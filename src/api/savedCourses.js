// API client for saved courses
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getSavedCourses(token) {
    const response = await fetch(`${API_BASE}/api/saved-courses`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch saved courses');
    }

    return response.json();
}

export async function saveCourse({ courseId, courseCode, courseTitle, courseData }, token) {
    const response = await fetch(`${API_BASE}/api/saved-courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, courseCode, courseTitle, courseData })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save course');
    }

    return response.json();
}

export async function unsaveCourse(courseId, token) {
    const response = await fetch(`${API_BASE}/api/saved-courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unsave course');
    }

    return response.json();
}
