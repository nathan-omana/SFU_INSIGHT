// SFU Course Outlines API for Schedule Data
// API Documentation: http://www.sfu.ca/bin/wcm/course-outlines

const SFU_API_BASE = 'http://www.sfu.ca/bin/wcm/course-outlines';

/**
 * Get departments for a given term
 */
export async function getDepartments(year, term) {
    const response = await fetch(`${SFU_API_BASE}?${year}/${term}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Get courses for a department
 */
export async function getCourses(year, term, dept) {
    const response = await fetch(`${SFU_API_BASE}?${year}/${term}/${dept}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Get sections for a course
 */
export async function getSections(year, term, dept, courseNum) {
    const response = await fetch(`${SFU_API_BASE}?${year}/${term}/${dept}/${courseNum}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Get full section details including schedule
 */
export async function getSectionDetails(year, term, dept, courseNum, section) {
    const response = await fetch(`${SFU_API_BASE}?${year}/${term}/${dept}/${courseNum}/${section}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
}

/**
 * Check if two time slots conflict
 */
export function checkTimeConflict(slot1, slot2) {
    if (slot1.day !== slot2.day) return false;
    const s1Start = timeToMinutes(slot1.startTime);
    const s1End = timeToMinutes(slot1.endTime);
    const s2Start = timeToMinutes(slot2.startTime);
    const s2End = timeToMinutes(slot2.endTime);
    return s1Start < s2End && s2Start < s1End;
}

/**
 * Generate a consistent color for a course
 */
const COLORS = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
    '#ef4444', '#06b6d4', '#ec4899', '#84cc16'
];

export function getCourseColor(courseCode) {
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
        hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}
