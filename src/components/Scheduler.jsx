import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import {
    getDepartments,
    getCourses,
    getSections,
    getSectionDetails,
    getCourseColor,
    timeToMinutes,
    checkTimeConflict
} from '../api/sfuScheduleApi';
import './Scheduler.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_MAP = { 'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday', 'Th': 'Thursday', 'Fr': 'Friday' };
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function Scheduler() {
    const [year] = useState('2025');
    const [term] = useState('spring');

    // Selection state
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [sections, setSections] = useState([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    // Schedule state
    const [schedule, setSchedule] = useState([]);
    const [conflicts, setConflicts] = useState([]);

    // Load departments on mount
    useEffect(() => {
        async function loadDepts() {
            try {
                const data = await getDepartments(year, term);
                setDepartments(data);
            } catch (err) {
                console.error('Failed to load departments:', err);
            } finally {
                setLoadingDepts(false);
            }
        }
        loadDepts();
    }, [year, term]);

    // Load courses when department changes
    useEffect(() => {
        if (!selectedDept) { setCourses([]); return; }
        async function loadCourses() {
            setLoadingCourses(true);
            try {
                const data = await getCourses(year, term, selectedDept);
                setCourses(data);
            } catch (err) {
                console.error('Failed to load courses:', err);
            } finally {
                setLoadingCourses(false);
            }
        }
        loadCourses();
    }, [year, term, selectedDept]);

    // Load sections when course changes
    useEffect(() => {
        if (!selectedCourse) { setSections([]); return; }
        async function loadSections() {
            setLoadingSections(true);
            try {
                const data = await getSections(year, term, selectedDept, selectedCourse);
                setSections(data);
            } catch (err) {
                console.error('Failed to load sections:', err);
            } finally {
                setLoadingSections(false);
            }
        }
        loadSections();
    }, [year, term, selectedDept, selectedCourse]);

    // Check for conflicts
    useEffect(() => {
        const allSlots = [];
        schedule.forEach(course => {
            course.schedule.forEach(slot => {
                const day = DAY_MAP[slot.days] || slot.days;
                allSlots.push({ courseCode: course.courseCode, section: course.section, day, startTime: slot.startTime, endTime: slot.endTime });
            });
        });

        const foundConflicts = [];
        for (let i = 0; i < allSlots.length; i++) {
            for (let j = i + 1; j < allSlots.length; j++) {
                if (checkTimeConflict(allSlots[i], allSlots[j])) {
                    foundConflicts.push([allSlots[i], allSlots[j]]);
                }
            }
        }
        setConflicts(foundConflicts);
    }, [schedule]);

    // Add section to schedule
    async function addSection(sectionData) {
        const courseCode = `${selectedDept.toUpperCase()} ${selectedCourse}`;
        const sectionId = sectionData.value;

        if (schedule.some(s => s.courseCode === courseCode && s.section === sectionId)) return;

        try {
            const details = await getSectionDetails(year, term, selectedDept, selectedCourse, sectionId);
            const courseSchedule = details.courseSchedule || details.info?.courseSchedule || [];

            setSchedule(prev => [...prev, {
                courseCode,
                section: sectionId.toUpperCase(),
                sectionCode: sectionData.sectionCode,
                title: sectionData.title,
                schedule: courseSchedule,
                color: getCourseColor(courseCode)
            }]);
        } catch (err) {
            console.error('Failed to load section details:', err);
        }
    }

    function removeSection(courseCode, section) {
        setSchedule(prev => prev.filter(s => !(s.courseCode === courseCode && s.section === section)));
    }

    function getSlotStyle(startTime, endTime) {
        const startMins = timeToMinutes(startTime);
        const endMins = timeToMinutes(endTime);
        const dayStartMins = 8 * 60;
        const top = ((startMins - dayStartMins) / 60) * 60;
        const height = ((endMins - startMins) / 60) * 60;
        return { top: `${top}px`, height: `${height}px` };
    }

    return (
        <div className="scheduler-container">
            <div className="scheduler-sidebar">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={24} color="#a6192e" />
                    Build Your Schedule
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>Spring 2025</p>

                <a
                    href="https://go.sfu.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: '#a6192e',
                        color: 'white',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}
                >
                    <ExternalLink size={16} />
                    Open SFU GO
                </a>

                {/* Department Select */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Department</label>
                    <select
                        value={selectedDept}
                        onChange={(e) => { setSelectedDept(e.target.value); setSelectedCourse(''); }}
                        className="scheduler-select"
                        disabled={loadingDepts}
                    >
                        <option value="">Select department...</option>
                        {departments.map(d => (
                            <option key={d.value} value={d.value}>{d.text} - {d.name}</option>
                        ))}
                    </select>
                </div>

                {/* Course Select */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Course</label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="scheduler-select"
                        disabled={!selectedDept || loadingCourses}
                    >
                        <option value="">Select course...</option>
                        {courses.map(c => (
                            <option key={c.value} value={c.value}>{c.text} - {c.title}</option>
                        ))}
                    </select>
                </div>

                {/* Sections List */}
                {selectedCourse && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Sections</label>
                        {loadingSections ? (
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Loading sections...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                {sections.map(s => (
                                    <button key={s.value} onClick={() => addSection(s)} className="section-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={`section-badge ${s.sectionCode?.toLowerCase() || 'lec'}`}>
                                                {s.sectionCode || 'LEC'}
                                            </span>
                                            <span style={{ fontWeight: '500' }}>{s.text}</span>
                                        </div>
                                        <Plus size={16} color="#9ca3af" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Added Courses */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.75rem' }}>Your Courses ({schedule.length})</h3>
                    {schedule.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>No courses added yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {schedule.map((s, idx) => (
                                <div key={idx} className="course-chip" style={{ borderLeftColor: s.color }}>
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{s.courseCode}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.section} ({s.sectionCode})</div>
                                    </div>
                                    <button onClick={() => removeSection(s.courseCode, s.section)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conflict Warning */}
                {conflicts.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            <AlertTriangle size={16} />
                            Time Conflict!
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#a16207' }}>
                            {conflicts[0][0].courseCode} and {conflicts[0][1].courseCode} overlap
                        </p>
                    </div>
                )}
            </div>

            {/* Calendar Grid */}
            <div className="scheduler-calendar">
                <div className="calendar-header">
                    <div className="time-column"></div>
                    {DAYS.map(day => (
                        <div key={day} className="day-header">{day}</div>
                    ))}
                </div>

                <div className="calendar-body">
                    <div className="time-column">
                        {HOURS.map(hour => (
                            <div key={hour} className="time-label">
                                {hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}
                            </div>
                        ))}
                    </div>

                    {DAYS.map(day => (
                        <div key={day} className="day-column">
                            {HOURS.map(hour => (
                                <div key={hour} className="hour-line"></div>
                            ))}

                            {schedule.map((course, cIdx) => (
                                course.schedule
                                    .filter(slot => DAY_MAP[slot.days] === day)
                                    .map((slot, sIdx) => (
                                        <div
                                            key={`${cIdx}-${sIdx}`}
                                            className="course-block"
                                            style={{
                                                ...getSlotStyle(slot.startTime, slot.endTime),
                                                backgroundColor: course.color,
                                            }}
                                        >
                                            <div className="course-block-title">{course.courseCode}</div>
                                            <div className="course-block-time">{slot.startTime} - {slot.endTime}</div>
                                            <div className="course-block-type">{slot.sectionCode}</div>
                                        </div>
                                    ))
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
