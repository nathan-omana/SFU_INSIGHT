import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, BookOpen, Star, User, Lock, ExternalLink,
    ThumbsUp, X, Bookmark, BarChart2, MessageSquare,
    CheckCircle, Zap, ShieldCheck
} from 'lucide-react';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { getDepartments } from './api/sfuCoursesApi';


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
        term: 'Fall 2025',
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
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // All, Courses, Professors
    const [selectedItem, setSelectedItem] = useState(null); // For modal
    const [savedCourses, setSavedCourses] = useState(new Set(['c1']));
    const [hasContributed, setHasContributed] = useState(false);
    const [showContributionForm, setShowContributionForm] = useState(false);
    const [resourceVotes, setResourceVotes] = useState({});
    const [majors, setMajors] = useState([]);
    const [selectedMajor, setSelectedMajor] = useState('');
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);

    // Fetch majors on component mount
    useEffect(() => {
        async function fetchMajors() {
            setLoadingMajors(true);
            try {
                const data = await getDepartments();
                // If data is an array of strings, use directly; otherwise extract department names
                if (Array.isArray(data)) {
                    setMajors(data);
                }
            } catch (error) {
                console.error('Failed to fetch majors:', error);
                // Fallback to common SFU departments if API fails
                setMajors(['CMPT', 'MACM', 'MATH', 'PHYS', 'CHEM', 'BISC', 'STAT', 'ECON', 'BUS', 'PSYC', 'ENSC', 'IAT', 'HSCI', 'ENGL', 'HIST', 'POL', 'CRIM', 'SA', 'GEOG', 'KIN']);
            } finally {
                setLoadingMajors(false);
            }
        }
        fetchMajors();
    }, []);

    // Search Logic
    const results = useMemo(() => {
        if (!search.trim()) return [];

        const query = search.toLowerCase();

        const matchedCourses = COURSES.filter(c =>
            c.code.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query)
        ).map(c => ({ type: 'course', data: c }));

        const matchedProfs = PROFS.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.course.toLowerCase().includes(query)
        ).map(p => ({ type: 'prof', data: p }));

        if (activeTab === 'Courses') return matchedCourses;
        if (activeTab === 'Professors') return matchedProfs;
        return [...matchedCourses, ...matchedProfs];
    }, [search, activeTab]);

    const toggleSave = (e, id) => {
        e.stopPropagation();
        const next = new Set(savedCourses);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSavedCourses(next);
    };

    const handleCreateReview = (e) => {
        e.preventDefault();
        setTimeout(() => {
            setHasContributed(true);
            setShowContributionForm(false);
        }, 800);
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
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setSearch(''); setSelectedItem(null); }}>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.25)' }}>
                            <BookOpen size={36} strokeWidth={2.5} color="white" />
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>SFU Insight</span>
                    </div>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
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


            {/* 2. Hero Search */}
            <section className="pt-24 pb-12 px-4 flex justify-center">
                <div className="w-full max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
                        Honest insights into SFU courses, powered by students like you.
                    </h1>
                    {/* <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
                        , real difficulty, instructor vibeWorkloads, topic maps, and best resources—powered by students like you.
                    </p> */}

                    <div className="max-w-2xl mx-auto mb-8">
                        <input
                            type="text"
                            placeholder="Course code, title, description, or professor name..." className="search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
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
                    <div style={{ marginTop: '2rem', position: 'relative' }}>
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
                            {selectedMajor || 'Select Your Major'}
                            <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>{showMajorDropdown ? '▲' : '▼'}</span>
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
                                width: '280px',
                                zIndex: 100
                            }}>
                                {loadingMajors ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Loading majors...</div>
                                ) : (
                                    majors.map((major, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedMajor(typeof major === 'string' ? major : major.name || major.value);
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
                                            {typeof major === 'string' ? major : major.name || major.value}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 3. Results Area */}
            {search && (
                <section className="container max-w-4xl mb-20 animate-fade-in">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 ml-1">
                        {results.length} Result{results.length !== 1 && 's'} Found
                    </h3>

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
                                        // Find related course to show insights for
                                        const relatedCourse = COURSES.find(c => c.id === item.data.courseId);
                                        if (relatedCourse) setSelectedItem(relatedCourse);
                                    }}
                                />
                            )
                        ))}
                        {results.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                No results found. Try "CMPT", "Math", or "Smith".
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 4. Default Homepage Content (if no search) */}
            {!search && (
                <section className="container max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                                <Zap size={18} className="text-amber-500" /> Popular this term
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {COURSES.map(c => (
                                    <div key={c.id} onClick={() => setSelectedItem(c)} className="bg-white border hover:border-red-300 cursor-pointer px-3 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700">
                                        {c.code}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                                <ShieldCheck size={18} className="text-emerald-500" /> Top Contributors
                            </h3>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">U{i}</div>
                                        <span>Contributed 3 resources to CMPT 225</span>
                                    </div>
                                ))}
                            </div>
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
                            <div className="relative">

                                {/* Content Logic */}
                                <div className={!hasContributed ? 'blur-content opacity-50' : ''}>
                                    <div className="mb-6">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <MessageSquare size={18} /> Crowd Tips
                                        </h4>
                                        <ul className="space-y-3">
                                            {selectedItem.tips.map((tip, i) => (
                                                <li key={i} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                                                    "{tip}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <BookOpen size={18} /> Top Resources
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedItem.resources.map((r, i) => (
                                                <div key={i} className="flex items-start justify-between p-3 rounded-md border border-gray-100 hover:border-red-200 transition bg-white">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold uppercase text-red-600 bg-red-50 px-1.5 rounded">{r.type}</span>
                                                            <a href="#" className="text-sm font-medium text-gray-900 hover:underline">{r.title}</a>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => incrementVote(r.id)}
                                                        className="flex flex-col items-center ml-3 text-gray-400 hover:text-green-600"
                                                    >
                                                        <ThumbsUp size={16} />
                                                        <span className="text-xs font-bold mt-1">{(r.votes || 0) + (resourceVotes[r.id] || 0)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Gate Overlay */}
                                {!hasContributed && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6">
                                        <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl border border-gray-200 max-w-sm">
                                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Lock size={24} />
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Unlock Full Insights</h4>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Contribute just <b>one review</b> to see full topic maps, exam tips, and resource libraries.
                                            </p>
                                            <button
                                                onClick={() => setShowContributionForm(true)}
                                                className="btn btn-primary w-full shadow-lg"
                                            >
                                                Write a 60-second review
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                            <button type="submit" className="btn btn-primary">
                                Submit Review
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
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
