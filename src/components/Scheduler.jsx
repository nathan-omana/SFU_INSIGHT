import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, Plus, AlertTriangle, Download, Link, Image, Search, Filter, XCircle, X, ExternalLink } from 'lucide-react';
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
    const deptRef = useRef(null);
    const courseRef = useRef(null);

    const [year] = useState('2026');
    const [term] = useState('spring');

    // Selection state
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [deptSearch, setDeptSearch] = useState('');
    const [showDeptDropdown, setShowDeptDropdown] = useState(false);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    const [sections, setSections] = useState([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    // Schedule state
    const [schedule, setSchedule] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [addError, setAddError] = useState(null);

    // Total credits tracker
    const [totalCredits, setTotalCredits] = useState(0);

    // Global search state
    const [globalSearch, setGlobalSearch] = useState('');
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const globalSearchRef = useRef(null);

    // Filter state
    const [filters, setFilters] = useState({
        campus: [],
        instructionMode: [],
        timeOfDay: []
    });
    const [showFilters, setShowFilters] = useState(false);

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

    // Phase 1: Persistence - Load from localStorage
    useEffect(() => {
        const savedSchedule = localStorage.getItem('sfu-schedule-2026');
        if (savedSchedule) {
            try {
                setSchedule(JSON.parse(savedSchedule));
            } catch (e) {
                console.error("Failed to parse saved schedule", e);
            }
        }
    }, []);

    // Phase 1: Persistence - Auto-save
    useEffect(() => {
        if (schedule.length >= 0) { // Save even if empty to allow clearing
            localStorage.setItem('sfu-schedule-2026', JSON.stringify(schedule));
        }

        // Phase 5: Calculate total credits
        // Note: SFU API doesn't always return units directly in the section details
        // We'll estimate based on typical values or parse if available
        // For now, we'll assume 3 units per course unless specified
        const total = schedule.reduce((acc, course) => {
            return acc + (course.units || 3);
        }, 0);
        setTotalCredits(total);

    }, [schedule]);

    // Phase 6: Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K for Search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowGlobalSearch(true);
                setTimeout(() => {
                    if (globalSearchRef.current) globalSearchRef.current.focus();
                }, 100);
            }

            // Escape to close dropdowns/modals
            if (e.key === 'Escape') {
                setShowGlobalSearch(false);
                setShowDeptDropdown(false);
                setShowCourseDropdown(false);
                setShowFilters(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Load courses when department changes
    useEffect(() => {
        let cancelled = false;
        if (!selectedDept) { setCourses([]); return; }

        async function loadCourses() {
            setLoadingCourses(true);
            try {
                const data = await getCourses(year, term, selectedDept);
                if (!cancelled) setCourses(data);
            } catch (err) {
                if (!cancelled) console.error('Failed to load courses:', err);
            } finally {
                if (!cancelled) setLoadingCourses(false);
            }
        }
        loadCourses();
        return () => { cancelled = true; };
    }, [year, term, selectedDept]);

    // Load sections when course changes
    useEffect(() => {
        let cancelled = false;
        if (!selectedCourse) { setSections([]); return; }

        async function loadSections() {
            setLoadingSections(true);
            try {
                // 1. Get list of sections
                const basicSections = await getSections(year, term, selectedDept, selectedCourse);
                if (cancelled) return;

                // 2. Fetch details for ALL sections in parallel to allow filtering/display
                // Sort by section code (D100, E100, etc)
                const detailedSections = await Promise.all(
                    basicSections.map(async (sec) => {
                        try {
                            const details = await getSectionDetails(year, term, selectedDept, selectedCourse, sec.value);
                            return {
                                ...sec,
                                ...details,
                                // Add helper fields for filtering
                                campus: details.campus || 'BURNABY', // Default
                                type: sec.sectionCode?.match(/^[A-Z]+/)?.[0] || 'LEC',
                                credits: details.units || 3
                            };
                        } catch (e) {
                            console.warn(`Failed to load details for ${sec.value}`, e);
                            return sec; // Return basic info if details fail
                        }
                    })
                );

                if (!cancelled) setSections(detailedSections);
            } catch (err) {
                if (!cancelled) console.error('Failed to load sections:', err);
            } finally {
                if (!cancelled) setLoadingSections(false);
            }
        }
        loadSections();
        return () => { cancelled = true; };
    }, [year, term, selectedDept, selectedCourse]);

    // Click-away handler to close dropdowns
    useEffect(() => {
        function handleClickOutside(event) {
            if (deptRef.current && !deptRef.current.contains(event.target)) {
                setShowDeptDropdown(false);
            }
            if (courseRef.current && !courseRef.current.contains(event.target)) {
                setShowCourseDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        setAddError(null);

        // Use pre-fetched details if available, otherwise (backup) fetch them
        let fullDetails = sectionData;
        if (!sectionData.schedule) {
            try {
                fullDetails = await getSectionDetails(year, term, selectedDept, selectedCourse, sectionData.value);
            } catch (err) {
                setAddError('Failed to load section details');
                return;
            }
        }

        const courseCode = `${selectedDept} ${selectedCourse}`;
        const sectionId = fullDetails.info.name; // e.g. D100

        // Check for duplicates
        const isDuplicate = schedule.some(c => c.courseCode === courseCode && c.section === sectionId);
        if (isDuplicate) {
            setAddError(`${courseCode} ${sectionId} is already in your schedule.`);
            setTimeout(() => setAddError(null), 3000);
            return;
        }

        const schedules = [];
        let buildingCode = 'TBA';
        let roomNumber = 'TBA';
        let campus = fullDetails.courseSchedule?.[0]?.campus || 'BURNABY';

        if (fullDetails.courseSchedule) {
            for (const sch of fullDetails.courseSchedule) {
                // Filter: Only include schedule slots that match the section we are adding
                // OR if it's the main section (e.g. LEC) and the slot matches that component
                // This prevents adding random labs associated with the course unless explicitly selected
                if (sch.sectionCode !== sectionId && sch.sectionCode !== sectionData.sectionCode) {
                    continue;
                }

                // Store Campus/Room info
                campus = sch.campus;
                if (sch.roomNumber) {
                    buildingCode = sch.buildingCode;
                    roomNumber = sch.roomNumber;
                }

                schedules.push({
                    days: sch.days,
                    startTime: sch.startTime,
                    endTime: sch.endTime,
                    room: roomNumber,
                    buildingCode: buildingCode,
                    sectionCode: sch.sectionCode
                });

                // Conflict Check Logic
                const newSlot = {
                    courseCode,
                    section: sectionId,
                    day: sch.days,
                    startTime: sch.startTime,
                    endTime: sch.endTime
                }

                // Check against existing schedule (EXCLUDING self if swapping)
                // We will filter out the SAME course from the conflict check to allow replacement
                const otherCourses = schedule.filter(c => c.courseCode !== courseCode);

                for (const existingCourse of otherCourses) {
                    for (const existSlot of existingCourse.schedule) {
                        if (checkTimeConflict(newSlot, existSlot)) {
                            setAddError(`⚠️ Time conflict! overlaps with ${existingCourse.courseCode}`);
                            setTimeout(() => setAddError(null), 5000);
                            return; // Stop adding this section if conflict found
                        }
                    }
                }
            }
        }

        // Add to schedule
        const newCourse = {
            courseCode,
            section: sectionId,
            sectionCode: fullDetails.info.sectionCode || 'LEC', // e.g. LEC
            title: fullDetails.info.title,
            instructor: fullDetails.instructor?.[0]?.name || 'TBA',
            color: getCourseColor(courseCode),
            schedule: schedules,
            campus: campus,
            units: parseInt(fullDetails.info.units || '3')
        };

        setSchedule(prev => {
            // Remove any existing instance of this course (Swap Logic)
            const filtered = prev.filter(c => c.courseCode !== courseCode);
            return [...filtered, newCourse];
        });
        setConflicts([]); // Clear conflicts if successful
    }

    function removeSection(courseCode, section) {
        setSchedule(prev => prev.filter(s => !(s.courseCode === courseCode && s.section === section)));
    }

    function handleFilterChange(category, value) {
        setFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    }

    // Phase 1: Clear Schedule
    function handleClearSchedule() {
        if (window.confirm('Are you sure you want to clear your entire schedule?')) {
            setSchedule([]);
            setConflicts([]);
        }
    }

    // Phase 2: Export to ICS
    function handleDownloadICS() {
        if (schedule.length === 0) return;

        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SFU Insight//Scheduler//EN\n";

        schedule.forEach(course => {
            course.schedule.forEach(slot => {
                // simple recurrence for the term
                if (!slot.startTime || !slot.days) return;

                // Map days to ICS format (Mo -> MO, Tu -> TU)
                const dayMap = { 'Mo': 'MO', 'Tu': 'TU', 'We': 'WE', 'Th': 'TH', 'Fr': 'FR' };
                const days = slot.days.split(', ').map(d => dayMap[d]).filter(Boolean).join(',');

                // Create a basic event (this is a simplified version)
                icsContent += "BEGIN:VEVENT\n";
                icsContent += `SUMMARY:${course.courseCode} ${course.sectionCode} - ${course.title}\n`;
                icsContent += `LOCATION:${slot.buildingCode} ${slot.room}\n`;
                icsContent += `DESCRIPTION:Instructor: ${course.instructor}\\nSection: ${course.section}\n`;
                icsContent += "END:VEVENT\n";
            });
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'sfu_schedule.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Phase 2: Copy Link
    function handleCopyLink() {
        // In a real app, this would generate a shareable URL
        // For now, we'll just copy a text summary
        const summary = schedule.map(s => `${s.courseCode} ${s.section}`).join('\n');
        navigator.clipboard.writeText(`My SFU Schedule:\n${summary}`).then(() => {
            alert('Schedule summary copied to clipboard!');
        });
    }

    function getSlotStyle(startTime, endTime) {
        const startMins = timeToMinutes(startTime);
        const endMins = timeToMinutes(endTime);
        const dayStartMins = 8 * 60; // 8:00 AM

        // Each hour is 60px high (1 minute = 1px)
        const top = (startMins - dayStartMins);
        const height = (endMins - startMins);

        return {
            top: `${top}px`,
            height: `${height}px`
        };
    }

    return (
        <div className="scheduler-container">
            <div className="scheduler-sidebar">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={24} color="#a6192e" />
                    Build Your Schedule
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>{term.charAt(0).toUpperCase() + term.slice(1)} {year}</p>

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
                <div ref={deptRef} style={{ marginBottom: '1rem', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Department</label>
                    <input
                        type="text"
                        value={deptSearch}
                        onChange={(e) => {
                            setDeptSearch(e.target.value);
                            setShowDeptDropdown(true);
                            if (selectedDept) {
                                setSelectedDept('');
                                setSelectedCourse('');
                                setCourseSearch('');
                            }
                        }}
                        onFocus={() => setShowDeptDropdown(true)}
                        placeholder={loadingDepts ? 'Loading...' : 'Type to search departments...'}
                        className="scheduler-select"
                        style={{ cursor: 'text' }}
                        disabled={loadingDepts}
                    />
                    {showDeptDropdown && !loadingDepts && (
                        <div className="search-dropdown">
                            {departments
                                .filter(d => {
                                    if (!d || !d.text || !d.name || !d.value) return false;
                                    const search = deptSearch.toLowerCase();
                                    return d.text.toLowerCase().includes(search) ||
                                        d.name.toLowerCase().includes(search) ||
                                        d.value.toLowerCase().includes(search);
                                })
                                .slice(0, 15)
                                .map(d => (
                                    <div
                                        key={d.value}
                                        className="search-dropdown-item"
                                        onClick={() => {
                                            setSelectedDept(d.value);
                                            setDeptSearch(`${d.text} - ${d.name} `);
                                            setShowDeptDropdown(false);
                                            setSelectedCourse('');
                                            setCourseSearch('');
                                        }}
                                    >
                                        <span style={{ fontWeight: '600' }}>{d.text}</span>
                                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>{d.name}</span>
                                    </div>
                                ))}
                            {departments.filter(d => {
                                if (!d || !d.text || !d.name || !d.value) return false;
                                const search = deptSearch.toLowerCase();
                                return d.text.toLowerCase().includes(search) ||
                                    d.name.toLowerCase().includes(search) ||
                                    d.value.toLowerCase().includes(search);
                            }).length === 0 && (
                                    <div style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>No departments found</div>
                                )}
                        </div>
                    )}
                </div>

                {/* Course Select */}
                <div ref={courseRef} style={{ marginBottom: '1rem', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Course</label>
                    <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => {
                            setCourseSearch(e.target.value);
                            setShowCourseDropdown(true);
                            if (selectedCourse) {
                                setSelectedCourse('');
                            }
                        }}
                        onFocus={() => setShowCourseDropdown(true)}
                        placeholder={!selectedDept ? 'Select department first...' : loadingCourses ? 'Loading...' : 'Type to search courses...'}
                        className="scheduler-select"
                        style={{ cursor: selectedDept ? 'text' : 'not-allowed' }}
                        disabled={!selectedDept || loadingCourses}
                    />
                    {showCourseDropdown && selectedDept && !loadingCourses && (
                        <div className="search-dropdown">
                            {courses
                                .filter(c => {
                                    if (!c || !c.text || !c.title || !c.value) return false;
                                    const search = courseSearch.toLowerCase();
                                    return c.text.toLowerCase().includes(search) ||
                                        c.title.toLowerCase().includes(search) ||
                                        c.value.toLowerCase().includes(search);
                                })
                                .slice(0, 15)
                                .map(c => (
                                    <div
                                        key={c.value}
                                        className="search-dropdown-item"
                                        onClick={() => {
                                            setSelectedCourse(c.value);
                                            setCourseSearch(`${c.text} - ${c.title} `);
                                            setShowCourseDropdown(false);
                                        }}
                                    >
                                        <span style={{ fontWeight: '600' }}>{c.text}</span>
                                        <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.8rem' }}>{c.title}</span>
                                    </div>
                                ))}
                            {courses.filter(c => {
                                if (!c || !c.text || !c.title || !c.value) return false;
                                const search = courseSearch.toLowerCase();
                                return c.text.toLowerCase().includes(search) ||
                                    c.title.toLowerCase().includes(search) ||
                                    c.value.toLowerCase().includes(search);
                            }).length === 0 && (
                                    <div style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>No courses found</div>
                                )}
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {addError && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ color: '#dc2626', fontWeight: '500', fontSize: '0.875rem' }}>{addError}</span>
                    </div>
                )}

                {/* Sections List */}
                {/* Sections List */}
                {selectedCourse && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Sections</label>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb', background: showFilters ? '#e5e7eb' : 'white', fontSize: '0.75rem', cursor: 'pointer', color: '#4b5563' }}
                            >
                                <Filter size={12} /> Filters
                            </button>
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.75rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#374151' }}>Campus</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['BURNABY', 'SURREY', 'VANCOUVER'].map(c => (
                                            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.campus.includes(c)}
                                                    onChange={() => handleFilterChange('campus', c)}
                                                /> {c.charAt(0) + c.slice(1).toLowerCase()}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#374151' }}>Type</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['LEC', 'LAB', 'TUT'].map(t => (
                                            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.instructionMode.includes(t)}
                                                    onChange={() => handleFilterChange('instructionMode', t)}
                                                /> {t}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#374151' }}>Time</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['Morning', 'Afternoon', 'Evening'].map(t => (
                                            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.timeOfDay.includes(t)}
                                                    onChange={() => handleFilterChange('timeOfDay', t)}
                                                /> {t}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {loadingSections ? (
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Loading sections...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {sections
                                    .filter(s => {
                                        // Campus Filter
                                        if (filters.campus.length > 0 && !filters.campus.includes(s.campus)) return false;
                                        // Type Filter
                                        if (filters.instructionMode.length > 0 && !filters.instructionMode.includes(s.type)) return false;
                                        // Time Filter
                                        if (filters.timeOfDay.length > 0 && s.courseSchedule) {
                                            const times = s.courseSchedule.map(sch => parseInt(sch.startTime.split(':')[0]));
                                            const isMorning = times.some(t => t < 12);
                                            const isAfternoon = times.some(t => t >= 12 && t < 17);
                                            const isEvening = times.some(t => t >= 17);

                                            const matches = (filters.timeOfDay.includes('Morning') && isMorning) ||
                                                (filters.timeOfDay.includes('Afternoon') && isAfternoon) ||
                                                (filters.timeOfDay.includes('Evening') && isEvening);
                                            if (!matches) return false;
                                        }
                                        return true;
                                    })
                                    .map(s => (
                                        <button key={s.value} onClick={() => addSection(s)} className="section-item">
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                                                    <span className={`section-badge ${s.type?.toLowerCase() || 'lec'}`}>
                                                        {s.type || 'LEC'}
                                                    </span>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.text}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '400' }}>#{s.info?.classNumber || '---'}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                                    <div>👨‍🏫 {s.instructor?.[0]?.name || 'TBA'}</div>
                                                    <div>
                                                        <span style={{
                                                            color: s.campus === 'SURREY' ? '#16a34a' : s.campus === 'BURNABY' ? '#7c3aed' : '#6b7280',
                                                            fontWeight: '500'
                                                        }}>{s.campus}</span> • {s.courseSchedule?.[0]?.days} {s.courseSchedule?.[0]?.startTime}-{s.courseSchedule?.[0]?.endTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <Plus size={16} color="#9ca3af" />
                                        </button>
                                    ))}
                                {sections.length > 0 && sections.filter(s => {
                                    if (filters.campus.length > 0 && !filters.campus.includes(s.campus)) return false;
                                    if (filters.instructionMode.length > 0 && !filters.instructionMode.includes(s.type)) return false;
                                    return true;
                                }).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                            No sections match filters
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                )}

                {/* Added Courses */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', margin: 0 }}>Your Courses ({schedule.length})</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {totalCredits} Units
                            </span>
                            {schedule.length > 0 && (
                                <button
                                    onClick={handleClearSchedule}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '0.25rem', padding: 0 }}
                                    title="Clear entire schedule"
                                >
                                    <XCircle size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {schedule.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>No courses added yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {schedule.map((s, idx) => (
                                <div key={idx} className="course-chip" style={{ borderLeftColor: s.color, flexDirection: 'column', alignItems: 'stretch' }}>
                                    {/* Course Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.courseCode}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.section} ({s.sectionCode})</div>
                                        </div>
                                        <button onClick={() => removeSection(s.courseCode, s.section)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Details Box */}
                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px', fontSize: '0.75rem' }}>
                                        {/* Professor */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                                            <span style={{ color: '#a6192e', fontWeight: '500' }}>👨‍🏫 Professor:</span>
                                            <span style={{ color: '#374151' }}>{s.instructor}</span>
                                        </div>

                                        {/* Campus */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                                            <span style={{ color: '#2563eb', fontWeight: '500' }}>🏫 Campus:</span>
                                            <span style={{
                                                color: s.campus === 'SURREY' ? '#16a34a' : s.campus === 'BURNABY' ? '#7c3aed' : '#6b7280',
                                                fontWeight: '500'
                                            }}>
                                                {s.campus}
                                            </span>
                                        </div>


                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Export Tools */}
                    {schedule.length > 0 && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                                Share & Export
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button onClick={handleDownloadICS} className="export-btn">
                                    <Download size={14} /> .ICS File
                                </button>
                                <button onClick={handleCopyLink} className="export-btn">
                                    <Link size={14} /> Copy Link
                                </button>
                            </div>
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

                {/* Calendar Grid */}
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
                                    .filter(slot => {
                                        if (!slot.days) return false;
                                        // This handles "Mo", "Mo, We", and "MoWe"
                                        const currentDayAbbr = Object.entries(DAY_MAP).find(([key, val]) => val === day)?.[0];
                                        return slot.days.includes(currentDayAbbr);
                                    })
                                    .map((slot, sIdx) => (
                                        <div
                                            key={`${cIdx}-${sIdx}`}
                                            className="course-block"
                                            title={`${course.courseCode} ${course.section}\n${course.instructor}\nClick to remove`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSection(course.courseCode, course.section);
                                            }}
                                            style={{
                                                ...getSlotStyle(slot.startTime, slot.endTime),
                                                backgroundColor: course.color,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div className="course-block-title">{course.courseCode}</div>
                                            <div className="course-block-time">{slot.startTime} - {slot.endTime}</div>
                                            <div className="course-block-type">{slot.sectionCode || course.sectionCode}</div>
                                            {slot.room && slot.room !== 'TBA' && (
                                                <div className="course-block-room">{slot.buildingCode} {slot.room}</div>
                                            )}
                                        </div>
                                    ))
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Search Modal (Ctrl+K) */}
            {showGlobalSearch && (
                <div className="global-search-overlay" onClick={(e) => {
                    if (e.target.className === 'global-search-overlay') setShowGlobalSearch(false);
                }}>
                    <div className="global-search-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Search size={20} color="#9ca3af" />
                            <input
                                ref={globalSearchRef}
                                type="text"
                                placeholder="Search courses (e.g., CMPT 120)..."
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        // Parse input: DEPT NUMBER (e.g., CMPT 120)
                                        const match = globalSearch.trim().match(/^([A-Za-z]{3,4})\s*(\d{3}\w?)?$/);
                                        if (match) {
                                            const deptCode = match[1].toUpperCase();
                                            const courseNum = match[2];

                                            // Find department
                                            const dept = departments.find(d => d.value === deptCode);
                                            if (dept) {
                                                setSelectedDept(deptCode);
                                                setDeptSearch(`${dept.text} - ${dept.name}`);
                                                setLoadingCourses(true);

                                                try {
                                                    // Fetch courses for this dept
                                                    const coursesData = await getCourses(year, term, deptCode);
                                                    setCourses(coursesData);

                                                    // If course number provided, find and select it
                                                    if (courseNum) {
                                                        const course = coursesData.find(c => c.value === courseNum);
                                                        if (course) {
                                                            setSelectedCourse(course.value);
                                                            setCourseSearch(`${course.text} - ${course.title}`);
                                                            setShowGlobalSearch(false);
                                                        } else {
                                                            alert(`Course ${deptCode} ${courseNum} not found.`);
                                                        }
                                                    } else {
                                                        setShowGlobalSearch(false);
                                                        // Just open the course dropdown
                                                        setTimeout(() => setShowCourseDropdown(true), 100);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to load courses');
                                                } finally {
                                                    setLoadingCourses(false);
                                                }
                                            } else {
                                                alert(`Department ${deptCode} not found.`);
                                            }
                                        }
                                    }
                                }}
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1.125rem' }}
                            />
                            <button onClick={() => setShowGlobalSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#9ca3af" />
                            </button>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', fontSize: '0.75rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Type department code and optional number</span>
                            <span>Press Enter to select</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
