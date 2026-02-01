import React from 'react';
import { ArrowLeft, BookOpen, Bookmark, Trash2, Star, Clock } from 'lucide-react';

export default function SavedCourses({ savedCourses, onBack, onSelectCourse, onRemoveCourse }) {
    const courses = savedCourses || [];

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
                                Saved Courses
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>
                                {courses.length} course{courses.length !== 1 ? 's' : ''} saved
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Empty State */}
                {courses.length === 0 && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '60px 40px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <Bookmark size={40} color="#9ca3af" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                            No saved courses yet
                        </h2>
                        <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '300px', margin: '0 auto' }}>
                            Search for courses and click the bookmark icon to save them here for quick access.
                        </p>
                    </div>
                )}

                {/* Course List */}
                {courses.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {courses.map((course, index) => (
                            <div
                                key={course.id || index}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    padding: '20px 24px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => onSelectCourse(course)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#a6192e';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(166,25,46,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <div style={{
                                                padding: '8px',
                                                backgroundColor: '#fef2f2',
                                                borderRadius: '10px'
                                            }}>
                                                <BookOpen size={20} color="#a6192e" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#a6192e', margin: 0 }}>
                                                    {course.code}
                                                </h3>
                                                <p style={{ fontSize: '14px', color: '#374151', margin: '2px 0 0', fontWeight: '500' }}>
                                                    {course.title}
                                                </p>
                                            </div>
                                        </div>

                                        {course.description && (
                                            <p style={{
                                                fontSize: '13px',
                                                color: '#6b7280',
                                                margin: '12px 0 0',
                                                lineHeight: '1.5',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {course.description}
                                            </p>
                                        )}

                                        {/* Quick Stats */}
                                        {course.metrics && (
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        Difficulty: {course.metrics.difficulty?.toFixed(1) || 'N/A'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14} color="#6b7280" />
                                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {course.metrics.workload || '?'} hrs/week
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveCourse(course.id);
                                        }}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: '#fef2f2',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#fee2e2';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#fef2f2';
                                        }}
                                        title="Remove from saved"
                                    >
                                        <Trash2 size={18} color="#dc2626" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                {courses.length > 0 && (
                    <div style={{
                        marginTop: '32px',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            💡 Tip: Click on a course to view detailed insights and the Path to Success guide.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
