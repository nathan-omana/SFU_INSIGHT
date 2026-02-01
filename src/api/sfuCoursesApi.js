//This file is used to fetch data from the SFU Courses API using the sfuCoursesApi.js file

// Base URL for the SFU Courses API
const API_BASE_URL = 'https://api.sfucourses.com/v1/rest';

/**
 * Fetch all course reviews summary
 * Returns: Array of {course_code, total_reviews, avg_rating, avg_difficulty}
 */
export async function getAllCourseReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/courses`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching course reviews:', error);
        throw error;
    }
}

/**
 * Fetch specific course review by course code
 * @param {string} courseCode - e.g., "CMPT225"
 */
export async function getCourseReview(courseCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/courses/${courseCode}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching review for ${courseCode}:`, error);
        throw error;
    }
}

/**
 * Fetch course outline information
 * @param {string} dept - Department code (e.g., "cmpt")
 * @param {string} number - Course number (e.g., "225")
 */
export async function getCourseOutline(dept, number) {
    try {
        const response = await fetch(`${API_BASE_URL}/outlines?dept=${dept}&number=${number}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching outline for ${dept} ${number}:`, error);
        throw error;
    }
}

/**
 * Fetch all instructor reviews
 */
export async function getAllInstructorReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/instructors`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching instructor reviews:', error);
        throw error;
    }
}

/**
 * Fetch specific instructor review
 * @param {string} instructorName - e.g., "John_Doe" or "John Doe"
 */
export async function getInstructorReview(instructorName) {
    try {
        // URL encode the name to handle spaces
        const encodedName = encodeURIComponent(instructorName);
        const response = await fetch(`${API_BASE_URL}/reviews/instructors/${encodedName}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching review for ${instructorName}:`, error);
        throw error;
    }
}

/**
 * Fetch all departments (majors)
 * Returns: Array of department codes and names
 */
export async function getDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}/outlines`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching departments:', error);
        throw error;
    }
}
