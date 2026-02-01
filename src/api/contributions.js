// API client for contributions
const API_BASE = 'http://localhost:3001';

export async function createContribution({
    courseCode, type, title, body, url, displayName,
    section, mattersIntensity, resourceType
}, token) {
    const response = await fetch(`${API_BASE}/api/contributions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            courseCode, type, title, body, url, displayName,
            section, mattersIntensity, resourceType
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contribution');
    }

    return response.json();
}


export async function uploadNotes({ courseCode, title, file, displayName }, token, onProgress) {
    // Convert file to base64
    const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:... prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    if (onProgress) onProgress(50); // Simulated progress

    const response = await fetch(`${API_BASE}/api/contributions/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            courseCode,
            title,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            fileBase64,
            displayName
        })
    });

    if (onProgress) onProgress(100);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
}

export async function listContributions(courseCode, type = null) {
    const url = new URL(`${API_BASE}/api/contributions/${encodeURIComponent(courseCode)}`);
    if (type) url.searchParams.set('type', type);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to load contributions');
    }

    return response.json();
}

export async function getDownloadUrl(contributionId, token) {
    const response = await fetch(`${API_BASE}/api/contributions/download/${contributionId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get download URL');
    }

    const data = await response.json();
    return data.url;
}

export async function toggleVote(contributionId, token) {
    const response = await fetch(`${API_BASE}/api/contributions/${contributionId}/vote`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle vote');
    }

    return response.json(); // { voted: true/false }
}

export async function getMyVotes(courseCode, token) {
    const response = await fetch(`${API_BASE}/api/contributions/${encodeURIComponent(courseCode)}/my-votes`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get votes');
    }

    return response.json(); // Array of contribution IDs
}
