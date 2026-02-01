import React, { useState, useMemo } from 'react';
import {
    Search, BookOpen, Star, User, Lock, ExternalLink,
    ThumbsUp, X, Bookmark, BarChart2, MessageSquare,
    CheckCircle, Zap, ShieldCheck
} from 'lucide-react';

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
        setTimeout(() => { // Mock network delay
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

            {/* 1. Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSearch(''); setSelectedItem(null); }}>
                        <div className="bg-red-600 text-white p-1.5 rounded-md">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">SFU Course Insight</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        {!hasContributed && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                                <Lock size={12} /> Contribute 1 review to unlock deeper insights
                            </span>
                        )}
                        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-700 transition">
                            <Bookmark size={18} />
                            <span>My Courses ({savedCourses.size})</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-700 transition">
                            <User size={18} />
                            <span>Login</span>
                        </button>
                        <button
                            onClick={() => setShowContributionForm(true)}
                            className="btn btn-primary text-sm shadow-sm"
                        >
                            Contribute
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Hero Search */}
            <section className="pt-20 pb-12 px-4">
                <div className="container max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
                        Find the <span className="text-red-600">truth</span> about SFU courses.
                    </h1>
                    <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
                        Workload, real difficulty, instructor vibes, topic maps, and best resources—powered by students like you.
                    </p>

                    <div className="relative max-w-2xl mx-auto mb-8">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                        <input
                            type="text"
                            placeholder="Search course code (e.g. CMPT 225), title, or professor..."
                            className="search-input"
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
