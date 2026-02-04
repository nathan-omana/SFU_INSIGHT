import express from 'express';
import cors from 'cors';
import rmp from '@mtucourses/rate-my-professors';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

// Access the RMP library functions from the default export
const searchTeacher = rmp.default?.searchTeacher || rmp.searchTeacher;
const getTeacher = rmp.default?.getTeacher || rmp.getTeacher;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000 || 3001;

// Initialize Clerk Client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Initialize Supabase Client (server-side with service key)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// File upload config
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

app.use(cors());
app.use(express.json({ limit: '15mb' })); // Increased for base64 uploads

const SFU_SCHOOL_ID = 'U2Nob29sLTE0ODI=';

// --- ROUTES ---

// 1. Search Instructors
app.get('/api/professors/search', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: 'Name parameter is required' });

        const professors = await searchTeacher(name, SFU_SCHOOL_ID);
        res.json(professors);
    } catch (error) {
        console.error('Error searching professors:', error);
        res.status(500).json({ error: 'Failed to search professors' });
    }
});

// 2. Get Instructor Details
app.get('/api/professors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const professor = await getTeacher(id);
        res.json(professor);
    } catch (error) {
        console.error('Error getting professor details:', error);
        res.status(500).json({ error: 'Failed to get professor details' });
    }
});

// 3. Submit Review & Unlock Content (Protected)
app.post('/api/reviews', async (req, res) => {
    try {
        const { userId, reviewData } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // In a real app, we would save reviewData to a database here.
        console.log(`[REVIEW SUBMITTED] User: ${userId}, Data:`, reviewData);

        // Update User Metadata in Clerk to mark as contributor
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                hasContributed: true
            }
        });

        res.json({ success: true, message: 'Review submitted and account unlocked!' });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// 4. Get courses taught by instructor (SFU Courses API)
app.get('/api/instructor-courses', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: 'Name required' });

        const baseUrl = 'https://www.sfu.ca/bin/wcm/course-outlines';

        // Normalize name for matching
        const normalizeName = (n) => {
            return n.toLowerCase()
                .replace(/^(dr\.?|prof\.?|professor)\s+/i, '')
                .replace(/,/g, ' ')
                .trim();
        };
        const queryName = normalizeName(name);
        const queryParts = queryName.split(/\s+/).filter(p => p.length > 1);

        // Fetch departments
        const deptRes = await fetch(`${baseUrl}?2025/spring`);
        const depts = await deptRes.json();

        const instructorCourses = [];
        const commonDepts = ['cmpt', 'math', 'macm', 'stat', 'phys', 'chem', 'bus', 'econ', 'psyc', 'bisc'];

        // Search common departments first for performance
        const searchDepts = depts.filter(d => commonDepts.includes(d.value?.toLowerCase())).slice(0, 10);

        for (const dept of searchDepts) {
            try {
                const coursesRes = await fetch(`${baseUrl}?2025/spring/${dept.value}`);
                const courses = await coursesRes.json();

                for (const course of courses.slice(0, 20)) { // Limit courses per dept
                    try {
                        const sectionsRes = await fetch(`${baseUrl}?2025/spring/${dept.value}/${course.value}`);
                        const sections = await sectionsRes.json();

                        for (const section of sections) {
                            if (section.classType === 'e' && section.sectionCode?.startsWith('D')) {
                                try {
                                    const detailRes = await fetch(`${baseUrl}?2025/spring/${dept.value}/${course.value}/${section.value}`);
                                    const detail = await detailRes.json();

                                    // Check if any instructor matches
                                    const instructors = detail.instructor || [];
                                    const matchedInstructor = instructors.find(i => {
                                        if (!i.name) return false;
                                        const instName = normalizeName(i.name);
                                        // Check if query parts match instructor name
                                        return queryParts.every(part => instName.includes(part)) ||
                                            instName.split(/\s+/).some(part => queryParts.includes(part));
                                    });

                                    if (matchedInstructor) {
                                        instructorCourses.push({
                                            code: `${dept.text} ${course.value}`,
                                            section: section.value,
                                            title: course.title || detail.info?.title || 'Course',
                                            schedule: detail.courseSchedule || [],
                                            campus: detail.info?.campus || 'TBD',
                                            deliveryMethod: detail.info?.deliveryMethod || 'In Person',
                                            instructor: matchedInstructor.name
                                        });
                                    }
                                } catch (e) { /* Skip section */ }
                            }
                        }
                    } catch (e) { /* Skip course */ }
                }
            } catch (e) { /* Skip dept */ }
        }

        console.log(`[INSTRUCTOR COURSES] Found ${instructorCourses.length} courses for "${name}"`);
        res.json(instructorCourses);
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        res.status(500).json({ error: 'Failed to fetch instructor courses' });
    }
});

// --- AUTH MIDDLEWARE ---
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT token with Clerk
        // The token from getToken() is a session JWT we can decode
        const payload = await clerkClient.verifyToken(token);

        if (!payload || !payload.sub) {
            return res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }

        req.userId = payload.sub; // Clerk user ID is in the 'sub' claim
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ error: 'Unauthorized - Token verification failed' });
    }
};

// 5. Protected Success Guide Data (requires authentication)
app.get('/api/success-guide/:courseCode', requireAuth, async (req, res) => {
    try {
        const { courseCode } = req.params;

        // In a real app, fetch from database
        // For now, return success to indicate auth passed
        console.log(`[SUCCESS GUIDE] User ${req.userId} accessed guide for ${courseCode}`);

        res.json({
            success: true,
            courseCode,
            message: 'Authenticated access granted',
            // The actual data is generated client-side from mockDataGenerator
            // This endpoint validates that the user is authenticated
        });
    } catch (error) {
        console.error('Error getting success guide:', error);
        res.status(500).json({ error: 'Failed to get success guide data' });
    }
});

// --- CONTRIBUTION ROUTES ---

// 6. Create text contribution (tip or resource)
app.post('/api/contributions', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { courseCode, type, title, body, url, displayName, section, mattersIntensity, resourceType } = req.body;

        if (!courseCode || !type || !title) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['tip', 'resource'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type for this endpoint' });
        }

        if (type === 'resource' && !url) {
            return res.status(400).json({ error: 'URL required for resource' });
        }

        // Validate tip fields
        if (type === 'tip') {
            if (!section || !['notes', 'advice', 'matters'].includes(section)) {
                return res.status(400).json({ error: 'Valid section required for tips' });
            }
            if (section === 'matters' && !mattersIntensity) {
                return res.status(400).json({ error: 'Intensity required for "What Actually Matters" tips' });
            }
            if (body && body.length < 15) {
                return res.status(400).json({ error: 'Tip must be at least 15 characters' });
            }
        }

        // Validate resource fields
        if (type === 'resource') {
            if (!resourceType || !['video', 'reading', 'practice'].includes(resourceType)) {
                return res.status(400).json({ error: 'Valid resource type required' });
            }
        }

        // Validate URL format
        if (url && !/^https?:\/\/.+/.test(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const { data, error } = await supabase
            .from('contributions')
            .insert({
                course_code: courseCode,
                contribution_type: type,
                title,
                body: body || null,
                url: type === 'resource' ? url : null,
                section: section || (type === 'resource' ? 'resources' : null),
                matters_intensity: section === 'matters' ? mattersIntensity : null,
                resource_type: type === 'resource' ? resourceType : null,
                created_by: req.userId,
                display_name: displayName || 'Anonymous'
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`[CONTRIBUTION] User ${req.userId} submitted ${type} (section: ${section || 'resources'}) for ${courseCode}`);
        res.json({ success: true, contribution: data });
    } catch (error) {
        console.error('Error creating contribution:', error);
        res.status(500).json({
            error: 'Failed to create contribution',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// 7. Upload file contribution (notes)
app.post('/api/contributions/upload', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { courseCode, title, fileName, mimeType, fileSize, fileBase64, displayName } = req.body;

        if (!courseCode || !title || !fileName || !fileBase64) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return res.status(400).json({ error: `File type not allowed. Allowed: PDF, PNG, JPG, DOC, DOCX` });
        }

        // Validate file size
        if (fileSize > MAX_FILE_SIZE) {
            return res.status(400).json({ error: 'File too large (max 10 MB)' });
        }

        // Sanitize file name (prevent path traversal)
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
        const timestamp = Date.now();
        const filePath = `courses/${courseCode}/${req.userId}/${timestamp}-${sanitizedName}`;

        // Decode base64 and upload
        const fileBuffer = Buffer.from(fileBase64, 'base64');

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('course-contributions')
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Create contribution record
        const { data, error } = await supabase
            .from('contributions')
            .insert({
                course_code: courseCode,
                contribution_type: 'note',
                title,
                file_path: filePath,
                file_name: sanitizedName,
                mime_type: mimeType,
                file_size: fileSize,
                created_by: req.userId,
                display_name: displayName || 'Anonymous'
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`[UPLOAD] User ${req.userId} uploaded ${sanitizedName} for ${courseCode}`);
        res.json({ success: true, contribution: data });
    } catch (error) {
        console.error('Error uploading contribution:', error);
        res.status(500).json({ error: 'Failed to upload contribution', details: error.message });
    }
});

// 8. List approved contributions for a course
app.get('/api/contributions/:courseCode', async (req, res) => {
    try {
        if (!supabase) {
            // Return empty array if Supabase not configured (graceful degradation)
            return res.json([]);
        }

        const { courseCode } = req.params;
        const { type } = req.query;

        let query = supabase
            .from('contributions')
            .select('*')
            .eq('course_code', courseCode)
            .eq('moderation_status', 'approved')
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('contribution_type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Error listing contributions:', error);
        res.status(500).json({ error: 'Failed to list contributions' });
    }
});

// 9. Get signed URL for file download
app.get('/api/contributions/download/:id', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;

        // Get contribution
        const { data: contribution, error: fetchError } = await supabase
            .from('contributions')
            .select('file_path')
            .eq('id', id)
            .single();

        if (fetchError || !contribution?.file_path) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Generate signed URL (expires in 1 hour)
        const { data, error } = await supabase.storage
            .from('course-contributions')
            .createSignedUrl(contribution.file_path, 3600);

        if (error) throw error;

        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

// 10. Toggle vote on a contribution
app.post('/api/contributions/:id/vote', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { id } = req.params;
        const userId = req.userId;

        // Check if user already voted
        const { data: existingVote } = await supabase
            .from('contribution_votes')
            .select('id')
            .eq('contribution_id', id)
            .eq('user_id', userId)
            .single();

        if (existingVote) {
            // Remove vote (un-vote)
            await supabase
                .from('contribution_votes')
                .delete()
                .eq('contribution_id', id)
                .eq('user_id', userId);

            // Decrement upvotes count
            await supabase.rpc('decrement_upvotes', { contribution_id: id });

            console.log(`[VOTE] User ${userId} removed vote from ${id}`);
            res.json({ voted: false });
        } else {
            // Add vote
            const { error } = await supabase
                .from('contribution_votes')
                .insert({ contribution_id: id, user_id: userId });

            if (error) throw error;

            // Increment upvotes count
            await supabase.rpc('increment_upvotes', { contribution_id: id });

            console.log(`[VOTE] User ${userId} voted for ${id}`);
            res.json({ voted: true });
        }
    } catch (error) {
        console.error('Error toggling vote:', error);
        res.status(500).json({ error: 'Failed to toggle vote' });
    }
});

// 11. Get user's votes for a course (to mark which they've voted for)
app.get('/api/contributions/:courseCode/my-votes', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.json([]);
        }

        const { courseCode } = req.params;
        const userId = req.userId;

        // Get all contribution IDs for this course that the user has voted for
        const { data, error } = await supabase
            .from('contribution_votes')
            .select('contribution_id, contributions!inner(course_code)')
            .eq('user_id', userId)
            .eq('contributions.course_code', courseCode);

        if (error) throw error;

        const votedIds = (data || []).map(v => v.contribution_id);
        res.json(votedIds);
    } catch (error) {
        console.error('Error fetching user votes:', error);
        res.status(500).json({ error: 'Failed to fetch user votes' });
    }
});

// --- SAVED COURSES ROUTES ---

// 12. Get user's saved courses
app.get('/api/saved-courses', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('saved_courses')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching saved courses:', error);
        res.status(500).json({ error: 'Failed to fetch saved courses' });
    }
});

// 13. Save a course
app.post('/api/saved-courses', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { courseId, courseCode, courseTitle, courseData } = req.body;

        if (!courseId || !courseCode) {
            return res.status(400).json({ error: 'courseId and courseCode required' });
        }

        // Upsert to handle duplicate saves gracefully
        const { data, error } = await supabase
            .from('saved_courses')
            .upsert({
                user_id: req.userId,
                course_id: courseId,
                course_code: courseCode,
                course_title: courseTitle || courseCode,
                course_data: courseData || null
            }, { onConflict: 'user_id,course_id' })
            .select()
            .single();

        if (error) throw error;

        console.log(`[SAVED] User ${req.userId} saved course ${courseCode}`);
        res.json({ success: true, savedCourse: data });
    } catch (error) {
        console.error('Error saving course:', error);
        res.status(500).json({ error: 'Failed to save course' });
    }
});

// 14. Unsave a course
app.delete('/api/saved-courses/:courseId', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { courseId } = req.params;

        const { error } = await supabase
            .from('saved_courses')
            .delete()
            .eq('user_id', req.userId)
            .eq('course_id', courseId);

        if (error) throw error;

        console.log(`[UNSAVED] User ${req.userId} unsaved course ${courseId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error unsaving course:', error);
        res.status(500).json({ error: 'Failed to unsave course' });
    }
});

// --- SCHEDULE PERSISTENCE ROUTES ---

// 15. Get user's saved schedule for a term
app.get('/api/schedules', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.json(null);
        }

        const { term } = req.query;
        if (!term) {
            return res.status(400).json({ error: 'Term is required' });
        }

        const { data, error } = await supabase
            .from('saved_schedules')
            .select('*')
            .eq('user_id', req.userId)
            .eq('term', term)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

        res.json(data || null);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// 16. Save/update user's schedule for a term (upsert)
app.post('/api/schedules', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { term, scheduleData, totalCredits } = req.body;

        if (!term) {
            return res.status(400).json({ error: 'Term is required' });
        }

        if (!Array.isArray(scheduleData)) {
            return res.status(400).json({ error: 'scheduleData must be an array' });
        }

        // Upsert: insert or update if exists
        const { data, error } = await supabase
            .from('saved_schedules')
            .upsert({
                user_id: req.userId,
                term,
                schedule_data: scheduleData,
                total_credits: totalCredits || 0,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,term' })
            .select()
            .single();

        if (error) throw error;

        console.log(`[SCHEDULE] User ${req.userId} saved schedule for ${term} (${scheduleData.length} courses)`);
        res.json({ success: true, schedule: data });
    } catch (error) {
        console.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// 17. Delete user's schedule for a term
app.delete('/api/schedules/:term', requireAuth, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured' });
        }

        const { term } = req.params;

        const { error } = await supabase
            .from('saved_schedules')
            .delete()
            .eq('user_id', req.userId)
            .eq('term', term);

        if (error) throw error;

        console.log(`[SCHEDULE] User ${req.userId} deleted schedule for ${term}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// Remove '127.0.0.1' so it can listen to external requests
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});