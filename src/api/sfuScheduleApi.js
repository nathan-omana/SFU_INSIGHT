// SFU Course Outlines API for Schedule Data
// API Documentation: http://www.sfu.ca/bin/wcm/course-outlines

const SFU_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * Scan for professors from major departments (Real API Fetch)
 * This crawls Dept -> Courses -> Sections -> SectionDetails to find instructors.
 * It calls onBatchFound with new unique professors as they are discovered.
 */
export async function startProfessorAggregation(year, term, onBatchFound) {
    const MAJOR_DEPTS = ['cmpt', 'bus', 'math', 'psyc', 'bisc', 'econ', 'ensc', 'phys', 'chem', 'crim'];
    const seenProfs = new Set();

    // Helper to process a department
    const processDept = async (dept) => {
        try {
            const courses = await getCourses(year, term, dept);
            // Limit to first 20 courses per dept to prevent excessive rate limiting
            const coursesToScan = courses.slice(0, 20);

            const deptProfs = [];

            // Process courses in small batches
            const BATCH_SIZE = 5;
            for (let i = 0; i < coursesToScan.length; i += BATCH_SIZE) {
                const batch = coursesToScan.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (course) => {
                    try {
                        const sections = await getSections(year, term, dept, course.value);
                        // Just check the first valid lecture section to save requests
                        const mainSection = sections.find(s => s.sectionCode === 'LEC') || sections[0];

                        if (mainSection) {
                            const details = await getSectionDetails(year, term, dept, course.value, mainSection.value);
                            if (details.instructor) {
                                details.instructor.forEach(inst => {
                                    if (inst.name && !seenProfs.has(inst.name)) {
                                        seenProfs.add(inst.name);
                                        deptProfs.push({
                                            id: `prof-${inst.name.replace(/\s+/g, '-').toLowerCase()}`,
                                            name: inst.name, // e.g. "Diana Cukierman"
                                            dept: dept.toUpperCase(),
                                            email: inst.email || '',
                                            profileUrl: inst.profileUrl || ''
                                        });
                                    }
                                });
                            }
                        }
                    } catch (err) {
                        // Continue if a single course fails
                    }
                }));
            }

            if (deptProfs.length > 0 && typeof onBatchFound === 'function') {
                onBatchFound(deptProfs);
            }
        } catch (e) {
            console.error(`Failed to scan dept ${dept}`, e);
        }
    };

    // Sequential execution of departments to be gentle on the API
    for (const dept of MAJOR_DEPTS) {
        await processDept(dept);
    }
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;

    // Matches "12:30pm" or "9:00am" or "14:30" (fallback)
    // SFU API usually returns 24h format "14:30" but sometimes AM/PM
    // We'll handle strictly AM/PM if present, otherwise assume 24h as before
    const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
    if (match) {
        let [_, hours, minutes, modifier] = match;
        hours = parseInt(hours);
        minutes = parseInt(minutes);

        if (modifier.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        }
        if (modifier.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        return hours * 60 + minutes;
    }

    // Fallback for 24h format (e.g. "14:30") if no am/pm found
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
}

/**
 * Check if two time slots conflict
 */
export function checkTimeConflict(slot1, slot2) {
    if (!slot1.day || !slot2.day) return false;

    // Check for day overlap
    const days1 = slot1.day.split(',').map(d => d.trim());
    const days2 = slot2.day.split(',').map(d => d.trim());
    const hasDayOverlap = days1.some(d => days2.includes(d));

    if (!hasDayOverlap) return false;

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
