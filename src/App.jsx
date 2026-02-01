import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, BookOpen, Star, User, Lock, ExternalLink,
    ThumbsUp, X, Bookmark, BarChart2, MessageSquare,
    CheckCircle, Zap, ShieldCheck, ArrowRight
} from 'lucide-react';

import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from '@clerk/clerk-react';
import { getDepartments, getCourses, startProfessorAggregation } from './api/sfuScheduleApi';
import Scheduler from './components/Scheduler';
import CourseSuccessGuide from './components/CourseSuccessGuide';


// --- MOCK DATA ---

const COURSES = [
    {
        id: 'c1',
        code: 'CMPT 225',
        title: 'Data Structures and Programming',
        term: 'Spring 2026',
        description: 'Data structures include lists, stacks, queues, trees, hash tables, and graphs. Algorithms include searching, sorting, and graph traversal.',
        metrics: { difficulty: 4.2, workload: 12, fairness: 3.5, clarity: 3.8, n: 142 },
        assessment: ['Midterm: 20%', 'Final: 50%', 'Labs: 30%'],
        harderThanPrereqs: 78,
        tips: [
            'Start assignments early, the C++ pointers will get you.',
            'Review recursion depth carefully for the midterm.',
            'The labs are free marks if you attend.'
        ],
        resources: [
            { id: 'r1', type: 'YouTube', title: 'CMPT 225 Full Lecture Series (2024)', url: '#', votes: 342 },
            { id: 'r2', type: 'Notes', title: 'Cheatsheet for Final Exam', url: '#', votes: 128 },
            { id: 'r3', type: 'Practice', title: 'LeetCode List for 225', url: '#', votes: 89 },
        ]
    },
    {
        id: 'c2',
        code: 'MACM 101',
        title: 'Discrete Mathematics I',
        term: 'Spring 2026',
        description: 'Introduction to counting, logic, sets, functions, relations, and proofs.',
        metrics: { difficulty: 3.8, workload: 8, fairness: 4.5, clarity: 4.2, n: 215 },
        assessment: ['Quizzes: 40%', 'Final: 60%'],
        harderThanPrereqs: 45,
        tips: [
            'Practice induction proofs daily.',
            'The textbook is actually useful for this one.',
            'Join the discord for study groups.'
        ],
        resources: [
            { id: 'r4', type: 'Notes', title: 'Logic & Proofs Summary', url: '#', votes: 201 },
            { id: 'r5', type: 'Video', title: 'TrevTutor Discrete Math', url: '#', votes: 56 }
        ]
    },
    {
        id: 'c3',
        code: 'BUS 201',
        title: 'Introduction to Business',
        term: 'Spring 2026',
        description: 'An overview of the business environment and the role of business in society.',
        metrics: { difficulty: 2.1, workload: 5, fairness: 4.8, clarity: 4.9, n: 89 },
        assessment: ['Group Project: 40%', 'Exam: 60%'],
        harderThanPrereqs: 12,
        tips: ['Choose your group members wisely.', 'Easy A if you participate.'],
        resources: []
    },
    {
        id: 'c4',
        code: 'IAT 102',
        title: 'Graphic Design',
        term: 'Spring 2026',
        description: 'Principles of visual communication and graphic design.',
        metrics: { difficulty: 3.5, workload: 15, fairness: 3.2, clarity: 3.5, n: 67 },
        assessment: ['Portfolio: 70%', 'Critiques: 30%'],
        harderThanPrereqs: 60,
        tips: ['You will spend all night in the lab.', 'Learn Adobe Illustrator beforehand.'],
        resources: [
            { id: 'r6', type: 'Guide', title: 'Typography Basics', url: '#', votes: 44 }
        ]
    }
];

const PROFS = [
    {
        id: 'p1',
        name: 'Dr. John Smith',
        course: 'CMPT 225',
        metrics: { clarity: 4.5, helpfulness: 4.8 },
        tags: ['Cares about students', 'Tough grader', 'Clear lectures'],
        courseId: 'c1'
    },
    {
        id: 'p2',
        name: 'Prof. Alice Wong',
        course: 'MACM 101',
        metrics: { clarity: 3.9, helpfulness: 4.1 },
        tags: ['Fast paced', 'Responds to emails', 'Textbook heavy'],
        courseId: 'c2'
    }
];

// --- APP COMPONENT ---

function App() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { openSignIn } = useClerk();

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // All, Courses, Professors
    const [selectedItem, setSelectedItem] = useState(null); // For modal
    const [savedCourses, setSavedCourses] = useState(new Set(['c1']));
    const [showContributionForm, setShowContributionForm] = useState(false);
    const [resourceVotes, setResourceVotes] = useState({});
    const [majors, setMajors] = useState([]);
    const [professors, setProfessors] = useState([
        // Seed with common profs for immediate search results
        { id: 'prof-diana', name: 'Diana Cukierman', dept: 'CMPT', email: 'diana@sfu.ca' },
        { id: 'prof-brian', name: 'Brian Fraser', dept: 'CMPT', email: 'bfraser@sfu.ca' },
        { id: 'prof-anne', name: 'Anne Lavergne', dept: 'CMPT', email: 'alavergne@sfu.ca' },
        { id: 'prof-jamie', name: 'Jamie Mulholland', dept: 'MATH', email: 'jmulholland@sfu.ca' },
        { id: 'prof-veselin', name: 'Veselin Jungic', dept: 'MATH', email: 'vjungic@sfu.ca' },
        { id: 'prof-sarah', name: 'Sarah Johnson', dept: 'PHYS', email: 'sjohnson@sfu.ca' },
        { id: 'prof-andrew', name: 'Andrew Gemino', dept: 'BUS', email: 'agemino@sfu.ca' },
        { id: 'prof-peter', name: 'Peter Tingling', dept: 'BUS', email: 'ptingling@sfu.ca' },
        { id: 'prof-igor', name: 'Igor Shinkar', dept: 'CMPT', email: 'ishinkar@sfu.ca' }
    ]); // Store aggregated professors
    const [selectedMajor, setSelectedMajor] = useState('');
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [majorCourses, setMajorCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [currentView, setCurrentView] = useState('home'); // 'home' or 'scheduler'
    const [searchResults, setSearchResults] = useState([]); // Kept for flat list compatibility if needed
    const [groupedResults, setGroupedResults] = useState([]); // New grouped structure
    const [searchLoading, setSearchLoading] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    // Derived state for contribution
    const hasContributed = user?.publicMetadata?.hasContributed === true;

    const [courseCache, setCourseCache] = useState({}); // Cache courses by department
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter departments for autocomplete suggestions
    // Simplified department filtering - just returns matching depts for internal use
    const filteredMajors = useMemo(() => {
        if (!search.trim()) return [];
        const query = search.trim().toUpperCase();
        const letters = query.match(/[A-Z]+/)?.[0] || '';
        if (!letters) return [];
        return majors.filter(m => {
            const deptCode = (m.text || m.value || m).toUpperCase();
            return deptCode.startsWith(letters);
        });
    }, [search, majors]);

    const [browseMode, setBrowseMode] = useState(false);
    const [browseLetter, setBrowseLetter] = useState('A'); // Default to A

    // Derived browse results
    const browseResults = useMemo(() => {
        if (!browseMode) return [];
        if (activeTab === 'Courses') { // Browsing Departments/Majors
            return majors.filter(m => {
                const name = m.text || m.value || '';
                return name.toUpperCase().startsWith(browseLetter);
            }).sort((a, b) => (a.text || '').localeCompare(b.text || ''));
        } else if (activeTab === 'Professors') {
            return professors.filter(p => p.name.toUpperCase().startsWith(browseLetter)).sort((a, b) => a.name.localeCompare(b.name));
        }
        return [];
    }, [activeTab, browseLetter, majors, browseMode]);
    // Fetch departments (majors) on component mount - using same API as Scheduler
    // Fetch departments and professors on component mount
    useEffect(() => {
        async function fetchData() {
            setLoadingMajors(true);
            try {
                // Fetch Majors
                const majorsData = await getDepartments('2026', 'spring');
                if (Array.isArray(majorsData)) {
                    setMajors(majorsData);
                }

                // Start Progressive Professor Scan
                if (typeof startProfessorAggregation === 'function') {
                    startProfessorAggregation('2026', 'spring', (newProfs) => {
                        setProfessors(prev => {
                            const combined = [...prev, ...newProfs];
                            // Remove duplicates by ID just in case
                            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                            return unique.sort((a, b) => a.name.localeCompare(b.name));
                        });
                    });
                }
            } catch (error) {
                // Fallback departments
                setMajors([
                    { value: 'cmpt', text: 'CMPT', name: 'Computing Science' },
                    { value: 'macm', text: 'MACM', name: 'Mathematics and Computing' },
                    { value: 'math', text: 'MATH', name: 'Mathematics' },
                    { value: 'phys', text: 'PHYS', name: 'Physics' },
                    { value: 'chem', text: 'CHEM', name: 'Chemistry' },
                    { value: 'bisc', text: 'BISC', name: 'Biological Sciences' },
                    { value: 'stat', text: 'STAT', name: 'Statistics' },
                    { value: 'econ', text: 'ECON', name: 'Economics' },
                    { value: 'bus', text: 'BUS', name: 'Business' },
                    { value: 'psyc', text: 'PSYC', name: 'Psychology' }
                ]);
            } finally {
                setLoadingMajors(false);
            }
        }
        fetchData();
    }, []);

    // Fetch courses when a major is selected
    useEffect(() => {
        if (!selectedMajor) {
            setMajorCourses([]);
            return;
        }
        async function fetchCourses() {
            setLoadingCourses(true);
            try {
                const data = await getCourses('2026', 'spring', selectedMajor);
                if (Array.isArray(data)) {
                    setMajorCourses(data);
                }
            } catch (error) {
                console.error('Failed to fetch courses:', error);
                setMajorCourses([]);
            } finally {
                setLoadingCourses(false);
            }
        }
        fetchCourses();
    }, [selectedMajor]);

    // Search Logic - fetch from API based on search input
    // Search Logic - fetch from API based on search input
    useEffect(() => {
        // Clear results if search is empty
        if (!search.trim()) {
            setSearchResults([]);
            setGroupedResults([]);
            return;
        }

        const query = search.trim().toUpperCase();

        // Extract letters (department) and numbers (course number) from query
        const letters = query.match(/[A-Z]+/)?.[0] || '';

        // Check for matching professors locally
        const matchingProfs = professors.filter(p => p.name.toUpperCase().includes(query)).map(p => ({
            type: 'prof',
            data: {
                id: p.id,
                name: p.name,
                dept: p.dept,
                email: p.email,
                courseId: null // Link to course if possible
            }
        }));

        // Find match departments for course search
        const matchingDepts = majors.filter(m => {
            const deptCode = (m.text || m.value || m).toUpperCase();
            return deptCode.startsWith(letters);
        }).slice(0, 5); // Limit to top 5 matching departments

        const fetchGroupedCourses = async () => {
            setSearchLoading(true);
            try {
                let validGroups = [];
                let courseResults = [];

                if (matchingDepts.length > 0) {
                    // Fetch courses for all matching departments in parallel
                    const promises = matchingDepts.map(async (major) => {
                        const deptCode = (major.text || major.value || major).toLowerCase();
                        const deptName = major.name || deptCode.toUpperCase();

                        // Check cache first
                        if (courseCache[deptCode]) {
                            return { dept: deptCode, name: deptName, courses: courseCache[deptCode] };
                        }

                        // Fetch if not cached
                        try {
                            const courses = await getCourses('2026', 'spring', deptCode);
                            if (Array.isArray(courses)) {
                                return { dept: deptCode, name: deptName, courses };
                            }
                        } catch (e) {
                            console.error(`Failed to fetch ${deptCode}`, e);
                        }
                        return null;
                    });

                    const results = await Promise.all(promises);

                    // Filter valid results and update cache
                    const newCache = {};
                    validGroups = results.filter(r => r && Array.isArray(r.courses) && r.courses.length > 0);

                    validGroups.forEach(g => {
                        if (!courseCache[g.dept]) {
                            newCache[g.dept] = g.courses;
                        }
                    });

                    if (Object.keys(newCache).length > 0) {
                        setCourseCache(prev => ({ ...prev, ...newCache }));
                    }

                    // Filter courses by number OR title (description) if provided
                    const grouped = validGroups.map(group => {
                        let filtered = group.courses;
                        const deptStr = group.dept.toUpperCase();
                        const queryTerm = query.replace(deptStr, '').trim();

                        if (queryTerm) {
                            filtered = group.courses.filter(c => {
                                const numberMatch = (c.value && c.value.startsWith(queryTerm)) ||
                                    (c.text && c.text.startsWith(queryTerm));
                                const titleMatch = c.title && c.title.toUpperCase().includes(queryTerm);
                                return numberMatch || titleMatch;
                            });
                        }

                        return {
                            dept: group.dept,
                            name: group.name,
                            courses: filtered.slice(0, 10).map(c => ({
                                type: 'course',
                                data: {
                                    id: `${group.dept}-${c.value}`,
                                    code: `${group.dept.toUpperCase()} ${c.value}`,
                                    title: c.title || 'Course',
                                    term: 'Spring 2026',
                                    description: `${group.dept.toUpperCase()} ${c.value} - ${c.title || 'Course details'}`,
                                    dept: group.dept,
                                    courseNum: c.value,
                                    metrics: { difficulty: 3.5, workload: 8, fairness: 4.0, clarity: 4.0, n: 0 },
                                    assessment: [],
                                    tips: [],
                                    resources: []
                                }
                            }))
                        };
                    }).filter(group => group.courses.length > 0);

                    // Update grouped results for dropdown
                    setGroupedResults(grouped);
                    courseResults = grouped.flatMap(g => g.courses);
                } else {
                    setGroupedResults([]);
                }

                // Combine results: Professors + Courses (Courses prioritized)
                setSearchResults([...courseResults, ...matchingProfs]);

            } catch (error) {
                console.error('Search failed:', error);
                setSearchResults(matchingProfs); // AT LEAST show profs if course fetch fails
                setGroupedResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        const timer = setTimeout(fetchGroupedCourses, 300);
        return () => clearTimeout(timer);
    }, [search, majors, courseCache, professors]);

    // Filter results by active tab
    const results = useMemo(() => {
        if (activeTab === 'Courses') return searchResults.filter(r => r.type === 'course');
        if (activeTab === 'Professors') return searchResults.filter(r => r.type === 'prof');
        return searchResults;
    }, [searchResults, activeTab]);

    const toggleSave = (e, id) => {
        e.stopPropagation();
        const next = new Set(savedCourses);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSavedCourses(next);
    };

    const handleCreateReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);

        try {
            // Collect form data (simplified for now)
            const formData = {
                courseCode: e.target[1].value,
                // ... other fields
            };

            const response = await fetch('http://localhost:3001/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, reviewData: formData })
            });

            if (response.ok) {
                await user.reload(); // Reload user to fetch updated metadata
                setShowContributionForm(false);
            } else {
                alert('Failed to submit review. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleUnlockClick = () => {
        if (!isSignedIn) {
            openSignIn();
        } else {
            setShowContributionForm(true);
        }
    };

    const incrementVote = (rId) => {
        setResourceVotes(prev => ({
            ...prev,
            [rId]: (prev[rId] || 0) + 1
        }));
    };

    return (
        <div className="min-h-screen pb-20">

            {/* Header */}
            <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#5c0a1f', borderBottom: '2px solid #3d0614', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <div className="w-full px-8 h-24 flex items-center justify-between">
                    <div
                        className="flex items-center gap-4 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setSearch(''); setSelectedItem(null); setCurrentView('home'); }}
                    >
                        <div style={{ padding: '0.75rem' }}>
                            <BookOpen size={36} strokeWidth={2.5} color="white" />
                        </div>
                        <span
                            style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.textShadow = '0 4px 12px rgba(255,255,255,0.3)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)'; }}
                        >SFU Insight</span>
                    </div>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView(currentView === 'scheduler' ? 'home' : 'scheduler'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: currentView === 'scheduler' ? 'rgba(255,255,255,0.2)' : 'transparent' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = currentView === 'scheduler' ? 'rgba(255,255,255,0.2)' : 'transparent'}>
                            <BarChart2 size={22} />
                            <span>Schedule</span>
                        </a>
                        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <Bookmark size={22} />
                            <span>Explore</span>
                        </a>

                        <SignedOut>
                            <SignInButton mode="modal">
                                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <User size={22} />
                                    <span>Login</span>
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="flex items-center gap-1.5">
                                <UserButton afterSignOutUrl="/" appearance={{
                                    elements: {
                                        avatarBox: "w-10 h-10 ring-2 ring-white/50"
                                    }
                                }} />
                            </div>
                        </SignedIn>
                    </nav>
                </div>
            </header>

            {/* Scheduler View */}
            {currentView === 'scheduler' && <Scheduler />}

            {/* Success Guide View */}
            {currentView === 'success-guide' && (
                <CourseSuccessGuide
                    course={selectedItem}
                    onBack={() => setCurrentView('home')}
                />
            )}

            {/* Home View */}
            {currentView === 'home' && (
                <>
                    {/* 2. Hero Search */}
                    <section className="pt-24 pb-12 px-4 flex justify-center">
                        <div className="w-full max-w-4xl text-center">
                            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
                                Honest insights into SFU courses, powered by students like you.
                            </h1>
                            {/* <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
                        , real difficulty, instructor vibeWorkloads, topic maps, and best resources—powered by students like you.
                    </p> */}

                            <div className="max-w-2xl mx-auto mb-8" style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search departments (e.g., CMPT, BUS, MATH)..."
                                    className="search-input"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    autoFocus
                                />

                                {/* Autocomplete Dropdown - Courses & Professors */}
                                {showSuggestions && (searchResults.length > 0) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '0.5rem',
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        overflowY: 'auto',
                                        maxHeight: '400px',
                                        zIndex: 100
                                    }}>
                                        {/* 1. Course Results (Grouped) */}
                                        {groupedResults.map((group) => (
                                            <div key={group.dept}>
                                                <div style={{
                                                    padding: '0.75rem 1.25rem',
                                                    backgroundColor: '#f9fafb',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    position: 'sticky',
                                                    top: 0
                                                }}>
                                                    <span style={{ fontWeight: '700', color: '#a6192e', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {group.name} ({group.dept.toUpperCase()})
                                                    </span>
                                                </div>
                                                {group.courses.map((result) => (
                                                    <div
                                                        key={result.data.id}
                                                        onClick={() => {
                                                            setSelectedItem(result.data);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="search-result-item"
                                                        style={{
                                                            padding: '0.75rem 1.25rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #f3f4f6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                    >
                                                        <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9375rem', minWidth: '80px' }}>
                                                            {result.data.code}
                                                        </span>
                                                        <span style={{ fontSize: '0.875rem', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {result.data.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}

                                        {/* 2. Professor Results (Flat) */}
                                        {searchResults.filter(r => r.type === 'prof').length > 0 && (
                                            <div>
                                                <div style={{
                                                    padding: '0.75rem 1.25rem',
                                                    backgroundColor: '#fef2f2', // Slightly redder for distinction
                                                    borderBottom: '1px solid #fee2e2',
                                                    borderTop: groupedResults.length > 0 ? '1px solid #e5e7eb' : 'none',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    position: 'sticky',
                                                    top: 0
                                                }}>
                                                    <span style={{ fontWeight: '700', color: '#be123c', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        PROFESSORS
                                                    </span>
                                                </div>
                                                {searchResults.filter(r => r.type === 'prof').map((result) => (
                                                    <div
                                                        key={result.data.id}
                                                        onClick={() => {
                                                            // For now, just select them or show an alert, or route to filtered view
                                                            alert(`Selected Professor: ${result.data.name}`);
                                                            setShowSuggestions(false);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1.25rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #f3f4f6',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                    >
                                                        <div style={{ background: '#e5e7eb', padding: '0.25rem', borderRadius: '50%' }}>
                                                            <User size={16} color="#4b5563" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9375rem' }}>
                                                                {result.data.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                {result.data.dept} Department
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                {['All', 'Courses', 'Professors'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`chip ${activeTab === tab ? 'active' : ''}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Major Selection */}
                            <div style={{
                                marginTop: '0.75rem',       /* Reduced from 2rem to move it up */
                                position: 'relative',
                                display: 'flex',            /* Added to enable centering */
                                justifyContent: 'center'    /* Centers the button horizontally */
                            }}>
                                <button
                                    onClick={() => setShowMajorDropdown(!showMajorDropdown)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.875rem 1.5rem',
                                        backgroundColor: selectedMajor ? '#a6192e' : 'white',
                                        color: selectedMajor ? 'white' : '#374151',
                                        border: '2px solid',
                                        borderColor: selectedMajor ? '#a6192e' : '#e5e7eb',
                                        borderRadius: '50px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                    }}
                                >
                                    <BookOpen size={20} />
                                    {selectedMajor ? selectedMajor.toUpperCase() : 'Select Your Major'}
                                    <span style={{ marginLeft: '0.1rem', fontSize: '0.75rem' }}>{showMajorDropdown ? '▲' : '▼'}</span>
                                </button>

                                {showMajorDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginTop: '0.5rem',
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        width: '320px',
                                        zIndex: 100
                                    }}>
                                        {loadingMajors ? (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Loading departments...</div>
                                        ) : (
                                            majors.map((major, idx) => (
                                                <div
                                                    key={major.value || idx}
                                                    onClick={() => {
                                                        setSelectedMajor(major.value || major);
                                                        setShowMajorDropdown(false);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: idx < majors.length - 1 ? '1px solid #f3f4f6' : 'none',
                                                        transition: 'background-color 0.15s',
                                                        fontSize: '0.9375rem',
                                                        color: '#374151'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <span style={{ fontWeight: '600' }}>{major.text || major}</span>
                                                    {major.name && <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>- {major.name}</span>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Course List When Major Selected */}
                            {selectedMajor && (
                                <div style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px', margin: '2rem auto 0' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={20} color="#a6192e" />
                                        {selectedMajor.toUpperCase()} Courses
                                        <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#6b7280' }}>
                                            ({majorCourses.length} courses)
                                        </span>
                                    </h3>

                                    {loadingCourses ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            Loading courses...
                                        </div>
                                    ) : majorCourses.length > 0 ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '0.75rem',
                                            maxHeight: '400px',
                                            overflowY: 'auto',
                                            padding: '0.5rem'
                                        }}>
                                            {majorCourses.map((course, idx) => (
                                                <div
                                                    key={course.value || idx}
                                                    onClick={() => setSearch(`${selectedMajor.toUpperCase()} ${course.value || course.text}`)}
                                                    style={{
                                                        padding: '0.875rem',
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.borderColor = '#a6192e';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(166,25,46,0.15)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600', color: '#a6192e', fontSize: '0.9375rem' }}>
                                                        {selectedMajor.toUpperCase()} {course.value || course.text}
                                                    </div>
                                                    {course.title && (
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: '1.3' }}>
                                                            {course.title}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                                            No courses found for this department.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. Results Area - Hide when searching via dropdown, or show if they hit enter/selected something */}
                    {search && !showSuggestions && (
                        <section className="container max-w-4xl mb-20 animate-fade-in">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 ml-1">
                                {searchLoading ? 'Searching...' : `${results.length} Result${results.length !== 1 ? 's' : ''} Found`}
                            </h3>

                            {searchLoading ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                                    Searching courses...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.map((item, idx) => (
                                        item.type === 'course' ? (
                                            <CourseCard
                                                key={item.data.id}
                                                course={item.data}
                                                saved={savedCourses.has(item.data.id)}
                                                onToggleSave={(e) => toggleSave(e, item.data.id)}
                                                onClick={() => setSelectedItem(item.data)}
                                            />
                                        ) : (
                                            <ProfCard
                                                key={item.data.id}
                                                prof={item.data}
                                                onClick={() => {
                                                    const relatedCourse = COURSES.find(c => c.id === item.data.courseId);
                                                    if (relatedCourse) setSelectedItem(relatedCourse);
                                                }}
                                            />
                                        )
                                    ))}
                                    {results.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-400">
                                            No results found. Try "CMPT 120" or "MATH 151".
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 4. Browse Interface (replaces default content) */}
                    {!search && (
                        <section className="container max-w-4xl animate-fade-in">
                            {/* Alphabet Scroll for Browse */}
                            <div className="flex flex-wrap justify-center gap-2 mb-10 px-4">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => {
                                            setBrowseMode(true);
                                            setBrowseLetter(letter);
                                            // Make sure we are in a valid browse tab
                                            if (activeTab === 'All') setActiveTab('Courses');
                                        }}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${browseLetter === letter
                                            ? 'bg-[#a6192e] text-white shadow-md transform scale-110'
                                            : 'bg-white text-gray-400 hover:bg-red-50 hover:text-[#a6192e]'
                                            }`}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        {activeTab === 'Professors' ? <User size={24} className="text-[#a6192e]" /> : <BookOpen size={24} className="text-[#a6192e]" />}
                                        Browsing {activeTab === 'All' ? 'Courses' : activeTab} - <span className="text-[#a6192e]">{browseLetter}</span>
                                    </h3>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {browseResults.length} result{browseResults.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {browseResults.length > 0 ? (
                                        browseResults.map((item, idx) => (
                                            activeTab === 'Professors' ? (
                                                <div key={idx} className="p-4 hover:bg-gray-50 flex items-center justify-between group cursor-pointer transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-red-50 text-[#a6192e] flex items-center justify-center font-bold">
                                                            {item.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 group-hover:text-[#a6192e] transition-colors">{item.name}</h4>
                                                            <p className="text-sm text-gray-500">{item.dept} Department</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#a6192e]" />
                                                </div>
                                            ) : (
                                                <div
                                                    key={idx}
                                                    className="p-4 hover:bg-gray-50 flex items-center justify-between group cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        // When browsing departments, select it to view courses
                                                        setSelectedMajor(item.value || item);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 group-hover:text-[#a6192e] transition-colors text-lg">
                                                            {item.text || item.value || item}
                                                        </h4>
                                                        {item.name && <p className="text-sm text-gray-500">{item.name}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-[#a6192e]">
                                                        View Courses <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            )
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-xl font-bold text-gray-300">?</span>
                                            </div>
                                            <p>No results found for "{browseLetter}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Footer */}
                    <footer className="mt-20 py-8 border-t border-gray-200 text-center text-gray-400 text-sm">
                        <p>Built for SFU Students. Crowdsourced insights; not official SFU.</p>
                    </footer>

                    {/* 5. Insights Panel (Modal) */}
                    {selectedItem && (
                        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                            <div className="modal-content relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <X size={24} />
                                </button>

                                {/* Modal Header */}
                                <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900">{selectedItem.code}</h2>
                                            <h3 className="text-lg text-gray-600">{selectedItem.title}</h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getLevelColor(selectedItem.metrics.difficulty)
                                            }`}>
                                            Difficulty: {selectedItem.metrics.difficulty}/5
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{selectedItem.description}</p>

                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5"><CheckCircle size={16} className="text-green-600" /> {selectedItem.term}</div>
                                        <div className="flex items-center gap-1.5"><User size={16} /> {selectedItem.metrics.n} Reviews</div>
                                    </div>
                                </div>

                                {/* Unlocked Content */}
                                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">

                                    {/* Left Column: Stats */}
                                    <div className="space-y-6">
                                        <StatBar label="Avg Workload" value={`${selectedItem.metrics.workload} h/week`} percent={selectedItem.metrics.workload * 5} color="bg-blue-500" />
                                        <StatBar label="Fairness" value={selectedItem.metrics.fairness} percent={(selectedItem.metrics.fairness / 5) * 100} color="bg-emerald-500" />
                                        <StatBar label="Clarity" value={selectedItem.metrics.clarity} percent={(selectedItem.metrics.clarity / 5) * 100} color="bg-purple-500" />

                                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <h4 className="font-bold text-orange-900 text-sm mb-2">Assessment</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedItem.assessment.map(a => (
                                                    <span key={a} className="bg-white px-2 py-1 rounded text-xs font-medium text-orange-800 border border-orange-100 shadow-sm">{a}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Protected Content */}
                                    {/* Right Column: Protected Content -> Call to Action */}
                                    <div className="flex flex-col justify-center h-full space-y-6">
                                        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm">
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Want the A+ blueprint?</h4>
                                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                                Access our curated guide for <b>{selectedItem.code}</b>. Includes community notes, video tutorials, and past syllabi.
                                            </p>

                                            <button
                                                onClick={() => {
                                                    setSelectedItem(selectedItem); // Keep context
                                                    setCurrentView('success-guide');
                                                }}
                                                className="w-full group relative flex items-center justify-center gap-3 py-3 bg-[#a6192e] hover:bg-[#8a1526] text-white rounded-xl font-bold shadow-lg shadow-red-900/10 hover:shadow-xl hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                                            >
                                                <span>How to succeed in {selectedItem.code.split(' ')[0]}</span>
                                                <div className="bg-white/20 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </button>

                                            <div className="mt-4 text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Crowd Data</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!hasContributed && (
                                    <div className="bg-amber-50 p-3 text-center text-xs font-medium text-amber-800 border-t border-amber-100 rounded-b-lg">
                                        <span className="font-bold">2,402 students</span> unlocked insights this week.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 6. Contribution Form (Modal) */}
                    {showContributionForm && (
                        <div className="modal-overlay">
                            <form onSubmit={handleCreateReview} className="modal-content max-w-lg p-6 animate-fade-in relative">
                                <button
                                    type="button"
                                    onClick={() => setShowContributionForm(false)}
                                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>

                                <h2 className="text-xl font-bold mb-1">Contribute Insight</h2>
                                <p className="text-gray-500 text-sm mb-6">Help your peers by reviewing a course you took.</p>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                                        <input required type="text" placeholder="e.g. CMPT 120" className="w-full p-2 border border-gray-300 rounded-md focus:border-red-500 outline-none" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty (1-5)</label>
                                            <input type="range" min="1" max="5" defaultValue="3" className="w-full accent-red-600" />
                                            <div className="flex justify-between text-xs text-gray-400"><span>Easy</span><span>Hard</span></div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Workload (hrs/wk)</label>
                                            <input type="number" min="0" max="40" defaultValue="5" className="w-full p-2 border border-gray-300 rounded-md" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">One Tip (Optional)</label>
                                        <textarea rows="2" placeholder="e.g. Focus on chapter 4..." className="w-full p-2 border border-gray-300 rounded-md outline-none text-sm"></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowContributionForm(false)}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submittingReview}
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </>
            )
            }

        </div >
    );
}

// --- SUB COMPONENTS ---

function CourseCard({ course, onClick, saved, onToggleSave }) {
    return (
        <div onClick={onClick} className="card p-5 cursor-pointer relative group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-red-700 transition-colors">{course.code}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.term}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 line-clamp-1">{course.title}</p>
                </div>
                <button
                    onClick={onToggleSave}
                    className={`p-1.5 rounded-full transition-colors ${saved ? 'text-red-600 bg-red-50' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                >
                    <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="flex gap-4 mt-4">
                <Metric badge label="Difficulty" value={course.metrics.difficulty} max={5} />
                <Metric label="Workload" value={`${course.metrics.workload}h`} />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Based on {course.metrics.n} reviews</span>
                <span className="flex items-center gap-1 font-medium text-red-600 group-hover:underline">
                    View Insights <BarChart2 size={12} />
                </span>
            </div>
        </div>
    );
}

function ProfCard({ prof, onClick }) {
    return (
        <div onClick={onClick} className="card p-5 cursor-pointer hover:border-blue-200 group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-700">{prof.name}</h4>
                    <p className="text-sm text-gray-500">Teaches <span className="font-medium text-gray-900">{prof.course}</span></p>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {prof.metrics.helpfulness}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
                {prof.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

function Metric({ label, value, badge }) {
    return (
        <div>
            <div className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{label}</div>
            <div className={`font-bold ${badge ? getLevelColor(value) + ' inline-block px-2 py-0.5 rounded text-sm' : 'text-gray-900'}`}>
                {value}
            </div>
        </div>
    );
}

function StatBar({ label, value, percent, color }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-bold text-gray-900">{value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
            </div>
        </div>
    );
}

function getLevelColor(val) {
    if (val >= 4) return 'bg-red-100 text-red-700';
    if (val >= 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
}

export default App;
