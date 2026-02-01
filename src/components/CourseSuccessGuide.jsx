import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, ChevronDown, ChevronUp, Star, Download,
    MessageSquare, BookOpen, FileText, Play, Link2,
    ExternalLink, Upload, Clock, CheckCircle,
    AlertTriangle, XCircle
} from 'lucide-react';
import { generateCourseData } from '../utils/mockDataGenerator';

// --- SUB-COMPONENTS --- //

function DifficultyStars({ rating, max = 5 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[...Array(max)].map((_, i) => (
                <Star
                    key={i}
                    size={18}
                    fill={i < rating ? '#facc15' : 'transparent'}
                    color={i < rating ? '#facc15' : '#d1d5db'}
                />
            ))}
        </div>
    );
}

function SnapshotCard({ label, value, icon: Icon }) {
    return (
        <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '90px',
            textAlign: 'center'
        }}>
            {Icon && <Icon size={20} color="#6b7280" style={{ marginBottom: '8px' }} />}
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                {label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                {value}
            </div>
        </div>
    );
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    backgroundColor: isOpen ? '#f9fafb' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOpen ? '#f9fafb' : 'white'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        padding: '10px',
                        borderRadius: '12px',
                        backgroundColor: isOpen ? '#a6192e' : '#f3f4f6',
                        color: isOpen ? 'white' : '#6b7280',
                        transition: 'all 0.2s'
                    }}>
                        <Icon size={20} />
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{title}</span>
                </div>
                <div style={{
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: isOpen ? '#e5e7eb' : 'transparent'
                }}>
                    {isOpen ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#9ca3af" />}
                </div>
            </button>

            {isOpen && (
                <div style={{
                    padding: '24px',
                    borderTop: '1px solid #f3f4f6'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function FocusItem({ level, title, description }) {
    const colors = {
        green: { bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981', text: '#065f46' },
        yellow: { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#92400e' },
        red: { bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', text: '#991b1b' }
    };
    const c = colors[level] || colors.green;

    return (
        <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: c.bg,
            border: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
        }}>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: c.dot,
                marginTop: '6px',
                flexShrink: 0
            }} />
            <div>
                <h4 style={{ fontWeight: '700', color: c.text, marginBottom: '4px', fontSize: '15px' }}>{title}</h4>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>{description}</p>
            </div>
        </div>
    );
}

function ResourceItem({ icon: Icon, title, description, link }) {
    return (
        <a
            href={link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a6192e';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
                <Icon size={20} color="#6b7280" />
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: '700', color: '#111827', marginBottom: '2px' }}>{title}</h4>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{description}</p>
            </div>
            <ExternalLink size={16} color="#d1d5db" style={{ marginTop: '4px' }} />
        </a>
    );
}

function QuoteCard({ quote, author }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #374151'
        }}>
            <p style={{ color: '#f3f4f6', fontStyle: 'italic', lineHeight: '1.6', fontSize: '15px', marginBottom: '12px' }}>
                "{quote}"
            </p>
            <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>— {author}</div>
        </div>
    );
}

// --- MAIN PAGE --- //

export default function CourseSuccessGuide({ course, onBack }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (course) {
            setTimeout(() => {
                const generated = generateCourseData(course.code);
                setData(generated);
            }, 300);
        }
    }, [course]);

    if (!data) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        backgroundColor: 'rgba(166,25,46,0.1)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <BookOpen size={32} color="#a6192e" />
                    </div>
                    <p style={{ color: '#6b7280' }}>Loading success guide...</p>
                </div>
            </div>
        );
    }

    // Transform data
    const snapshot = {
        difficulty: Math.round(parseFloat(data.stats?.difficulty) || 4),
        timeCommitment: `${Math.round(parseFloat(data.stats?.workload) || 8)}–${Math.round((parseFloat(data.stats?.workload) || 8) + 4)} h/week`,
        assessmentStyle: 'Assignments + Midterms + Final',
        mathIntensity: 'Medium–High',
        programming: course.code?.includes('CMPT') ? 'Python/C++' : 'MATLAB'
    };

    const syllabi = (data.syllabi || []).map(s => ({
        term: s.term,
        prof: s.prof,
        topics: s.topics || 'Core course concepts and methodologies'
    }));

    const alumniNotes = (data.notes || []).map(note => ({
        title: note.title,
        description: note.description || `Shared by ${note.author || 'Anonymous'} • ${note.date || 'Recently'}`,
        tags: note.tags || ['Study Notes'],
        upvotes: note.upvotes || 0
    }));

    const focusAreas = {
        green: [
            { title: "Understanding core algorithm convergence", description: "This is tested heavily on exams and assignments." },
            { title: "Translating theory into working code", description: "Practice coding exercises from scratch." },
            { title: "Recognizing exam patterns", description: "Past midterms are your best study resource." }
        ],
        yellow: [
            { title: "Definitions and terminology", description: "Exam wording matters. Know the precise terms." },
            { title: "Basic proof outlines", description: "Conceptual understanding > full memorization." }
        ],
        red: [
            { title: "Rare edge-case theorems", description: "Don't spend hours on theorems that rarely appear." },
            { title: "Full derivations", description: "Focus on understanding, not memorizing long proofs." }
        ]
    };

    const resources = {
        videos: [
            { title: 'Core Concepts Playlist', description: 'Short videos explaining key topics', link: '#' },
            { title: 'Coding Tutorials', description: 'Step-by-step implementation guides', link: '#' }
        ],
        readings: [
            { title: 'Textbook Key Sections', description: 'Core sections that align with exams', link: '#' },
            { title: 'Student Study Guide', description: 'Alternative explanations by past students', link: '#' }
        ],
        practice: [
            { title: 'Practice Problems', description: 'Community-created practice with solutions', link: '#' },
            { title: 'Past Midterms', description: 'When permitted by instructors', link: '#' }
        ]
    };

    const studentAdvice = data.reviews?.slice(0, 2).map(r => ({ quote: r.comment, author: r.author })) || [
        { quote: "Start assignments early — everyone underestimates how much time it takes.", author: "CS Major, 2024" },
        { quote: "Exams test intuition more than computation.", author: "Math Minor, 2023" }
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', paddingBottom: '80px' }}>

            {/* Header */}
            <div style={{
                backgroundColor: '#a6192e',
                position: 'sticky',
                top: 0,
                zIndex: 40,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ maxWidth: '896px', margin: '0 auto', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={onBack}
                            style={{
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>
                                How to Succeed in {course.code}
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
                                Student- and alumni-sourced strategies, notes, and resources
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Course Snapshot */}
                <section style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '28px',
                    marginBottom: '24px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}></span> Course Snapshot
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '12px'
                    }}>
                        <div style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '90px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                Difficulty
                            </div>
                            <DifficultyStars rating={snapshot.difficulty} />
                        </div>
                        <SnapshotCard label="Time Commitment" value={snapshot.timeCommitment} icon={Clock} />
                        <SnapshotCard label="Assessment" value={snapshot.assessmentStyle} icon={FileText} />
                        <SnapshotCard label="Math Intensity" value={snapshot.mathIntensity} icon={AlertTriangle} />
                        <SnapshotCard label="Programming" value={snapshot.programming} icon={BookOpen} />
                    </div>
                </section>

                {/* Accordions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Past Syllabi */}
                    <Accordion title="Past Syllabi & Course Structure" icon={FileText} defaultOpen={true}>
                        <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginBottom: '16px' }}>
                            Syllabi may vary by instructor and term.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {syllabi.map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>{s.term}</div>
                                        <div style={{ fontSize: '14px', color: '#a6192e', fontWeight: '600', marginTop: '4px' }}>{s.prof}</div>
                                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Key topics: {s.topics}</div>
                                    </div>
                                    <button style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        cursor: 'pointer'
                                    }}>
                                        <Download size={14} /> View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Accordion>

                    {/* Alumni Notes */}
                    <Accordion title="Alumni Notes & Study Guides" icon={BookOpen} defaultOpen={false}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {alumniNotes.map((note, i) => (
                                <div key={i} style={{
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontWeight: '700', color: '#111827', fontSize: '15px', marginBottom: '6px' }}>{note.title}</h4>
                                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>{note.description}</p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {note.tags.map(tag => (
                                                    <span key={tag} style={{
                                                        fontSize: '11px',
                                                        backgroundColor: '#f3f4f6',
                                                        color: '#4b5563',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#10b981',
                                            fontWeight: '700',
                                            backgroundColor: '#ecfdf5',
                                            padding: '6px 12px',
                                            borderRadius: '20px'
                                        }}>
                                            👍 {note.upvotes}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Accordion>

                    {/* What Actually Matters */}
                    <Accordion title="What Actually Matters" icon={CheckCircle} defaultOpen={false}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={16} /> Focus heavily on
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {focusAreas.green.map((item, i) => (
                                        <FocusItem key={i} level="green" title={item.title} description={item.description} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} /> Know well
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {focusAreas.yellow.map((item, i) => (
                                        <FocusItem key={i} level="yellow" title={item.title} description={item.description} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <XCircle size={16} /> Don't overinvest in
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {focusAreas.red.map((item, i) => (
                                        <FocusItem key={i} level="red" title={item.title} description={item.description} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Accordion>

                    {/* Recommended Resources */}
                    <Accordion title="Recommended Resources" icon={Link2} defaultOpen={false}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Play size={16} color="#ef4444" /> Videos
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {resources.videos.map((r, i) => (
                                        <ResourceItem key={i} icon={Play} title={r.title} description={r.description} link={r.link} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={16} color="#3b82f6" /> Readings
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {resources.readings.map((r, i) => (
                                        <ResourceItem key={i} icon={BookOpen} title={r.title} description={r.description} link={r.link} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} color="#8b5cf6" /> Practice
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {resources.practice.map((r, i) => (
                                        <ResourceItem key={i} icon={FileText} title={r.title} description={r.description} link={r.link} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Accordion>

                    {/* Student Advice */}
                    <Accordion title="Advice From Students" icon={MessageSquare} defaultOpen={false}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {studentAdvice.map((advice, i) => (
                                <QuoteCard key={i} quote={advice.quote} author={advice.author} />
                            ))}
                        </div>
                    </Accordion>

                </div>

                {/* Contribution CTA */}
                <section style={{
                    marginTop: '32px',
                    background: 'linear-gradient(135deg, #a6192e 0%, #c42a3d 100%)',
                    padding: '40px',
                    borderRadius: '24px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px rgba(166,25,46,0.3)'
                }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>
                        Help Future Students Succeed
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '28px', maxWidth: '400px', margin: '0 auto 28px' }}>
                        Contribute by uploading notes, sharing tips, or recommending resources.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            color: '#a6192e',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                            <Upload size={18} /> Upload Notes
                        </button>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '12px',
                            fontWeight: '700',
                            color: 'white',
                            cursor: 'pointer'
                        }}>
                            <MessageSquare size={18} /> Share Tips
                        </button>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '12px',
                            fontWeight: '700',
                            color: 'white',
                            cursor: 'pointer'
                        }}>
                            <Link2 size={18} /> Recommend Resource
                        </button>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '24px', fontStyle: 'italic' }}>
                        Powered by SFU students, for SFU students.
                    </p>
                </section>

            </div>
        </div>
    );
}
