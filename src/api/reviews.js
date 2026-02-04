// API client for course reviews
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getReviewStats(courseCode) {
    const res = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseCode)}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function getReviews(courseCode, sort = 'recent') {
    const res = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseCode)}/reviews?sort=${sort}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
}

export async function submitReview(courseCode, reviewData, token) {
    const res = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseCode)}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit review');
    }
    return res.json();
}

export async function deleteReview(reviewId, token) {
    const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete review');
    return res.json();
}

export async function toggleVote(reviewId, token) {
    const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to toggle vote');
    return res.json();
}

export async function getMyVotes(token) {
    const res = await fetch(`${API_BASE}/api/reviews/my-votes`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
}

export async function getMyReview(courseCode, term, token) {
    const url = term
        ? `${API_BASE}/api/courses/${encodeURIComponent(courseCode)}/my-review?term=${encodeURIComponent(term)}`
        : `${API_BASE}/api/courses/${encodeURIComponent(courseCode)}/my-review`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
}
