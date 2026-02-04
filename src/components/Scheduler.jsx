import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, Plus, AlertTriangle, Download, Link, Image, Search, Filter, XCircle, X, ExternalLink, Save, Loader2, CheckCircle } from 'lucide-react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import {
    getDepartments,
    getCourses,
    getSections,
    getSectionDetails,
    getCourseColor,
    timeToMinutes,
    checkTimeConflict
} from '../api/sfuScheduleApi';
import { getSchedule, saveSchedule } from '../api/schedules';
import './Scheduler.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_MAP = { 'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday', 'Th': 'Thursday', 'Fr': 'Friday' };
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function Scheduler() {
    // Clerk auth
    const { isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { openSignIn } = useClerk();

    const deptRef = useRef(null);
    const courseRef = useRef(null);
    const [year] = useState('2026');
    const [term] = useState('spring');
    const termKey = `${term}_${year}`; // e.g., "spring_2026"

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

    // Save/Load state
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null, 'success', 'error'

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

    // Load saved schedule from database when user signs in
    useEffect(() => {
        async function loadSavedSchedule() {
            if (!isLoaded) return;

            if (!isSignedIn) {
                // Clear schedule when logged out
                setSchedule([]);
                return;
            }

            setScheduleLoading(true);
            try {
                const token = await getToken();
                if (!token) return;

                const savedData = await getSchedule(termKey, token);
                if (savedData && savedData.schedule_data) {
                    setSchedule(savedData.schedule_data);
                }
            } catch (error) {
                console.log('Could not load saved schedule:', error);
            } finally {
                setScheduleLoading(false);
            }
        }

        loadSavedSchedule();
    }, [isSignedIn, isLoaded, termKey, getToken]);

    // Calculate total credits when schedule changes
    useEffect(() => {
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
                                type: (() => {
                                    const rawType = (details.info?.type || '').toUpperCase();
                                    const secCode = sec.sectionCode || '';

                                    if (rawType === 'E') return 'LEC'; // Enrollment section
                                    if (rawType === 'N') return 'LAB'; // Non-enrollment (Lab/Tut)

                                    if (rawType.includes('LAB')) return 'LAB';
                                    if (rawType.includes('TUT')) return 'TUT';
                                    if (rawType.includes('SEM')) return 'SEM';
                                    if (rawType.includes('LEC')) return 'LEC';

                                    // Fallback Heuristic: D100, E100 are usually Lectures. D101+ are labs.
                                    if (secCode.endsWith('00')) return 'LEC';

                                    // Default
                                    return 'LEC';
                                })(),
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
    // Add section to schedule
    async function addSection(sectionData) {
        setAddError(null);

        // For DnD, we might pass dept/number in sectionData. 
        // For Sidebar "Add", we use selectedDept/selectedCourse state.
        const dept = sectionData.dept || selectedDept;
        const courseNum = sectionData.number || selectedCourse;

        // Use pre-fetched details if available, otherwise (backup) fetch them
        let fullDetails = sectionData;
        if (!sectionData.schedule) {
            try {
                // BUG FIX: Use the specific dept/courseNum, not just selected state
                fullDetails = await getSectionDetails(year, term, dept, courseNum, sectionData.value);
            } catch (err) {
                setAddError('Failed to load section details');
                return;
            }
        }

        const courseCode = sectionData.courseCode || `${dept} ${courseNum}`;
        const sectionId = fullDetails.info.name; // e.g. D100
        // Use the 'type' we calculated in loadSections (LEC, LAB, TUT)
        const componentType = sectionData.type || 'LEC';

        // Check for duplicates (Exact same section)
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

                // Check against existing schedule
                // IGNORE the specific component we are replacing (same course + same type)
                // BUT check against everything else (different courses OR different components of same course)
                const otherCourses = schedule.filter(c => !(c.courseCode === courseCode && c.componentType === componentType));

                for (const existingCourse of otherCourses) {
                    for (const existSlot of existingCourse.schedule) {
                        if (checkTimeConflict(newSlot, existSlot)) {
                            setAddError(`⚠️ Time conflict with ${existingCourse.courseCode} (${existingCourse.section})`);
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
            section: sectionId, // D100
            sectionCode: fullDetails.info.sectionCode || 'LEC', // LEC (API code)
            componentType: componentType, // LEC, LAB, TUT (Our normalized type)
            title: fullDetails.info.title,
            instructor: fullDetails.instructor?.[0]?.name || 'TBA',
            color: getCourseColor(courseCode),
            schedule: schedules,
            campus: campus,
            units: parseInt(fullDetails.info.units || '3')
        };

        setSchedule(prev => {
            // Smart Swap: Only remove the same TYPE of section for this course
            const filtered = prev.filter(c => {
                // Keep distinct courses
                if (c.courseCode !== courseCode) return true;

                // For the SAME course, only remove if the component type matches
                // (e.g. Remove existing LAB if adding a LAB. Keep LEC.)
                return c.componentType !== componentType;
            });
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

    // Save schedule to database
    async function handleSaveSchedule() {
        // Require sign-in
        if (!isSignedIn) {
            openSignIn({
                afterSignInUrl: window.location.href,
                afterSignUpUrl: window.location.href
            });
            return;
        }

        setSaving(true);
        setSaveStatus(null);

        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            await saveSchedule({
                term: termKey,
                scheduleData: schedule,
                totalCredits
            }, token);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2500);
        } catch (error) {
            console.error('Failed to save schedule:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setSaving(false);
        }
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
                    Open MySchedule
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

                        {/* Filters Panel - Simplified */}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>

                                {/* Step 1: Lectures */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a6192e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Step 1: Select Lecture
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {sections
                                            .filter(s => s.type === 'LEC')
                                            .filter(s => {
                                                if (filters.campus.length > 0 && !filters.campus.includes(s.campus)) return false;
                                                return true;
                                            })
                                            .map(s => (
                                                <button key={s.value} onClick={() => addSection(s)} className="section-item" style={{ borderLeft: schedule.some(c => c.section === s.text) ? '4px solid #10b981' : '1px solid #e5e7eb' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                                                            <span className="section-badge lec">LEC</span>
                                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.text}</span>
                                                            {schedule.some(c => c.section === s.text) && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                            {s.instructor?.[0]?.name || 'TBA'} • {s.courseSchedule?.[0]?.days} {s.courseSchedule?.[0]?.startTime}-{s.courseSchedule?.[0]?.endTime}
                                                        </div>
                                                    </div>
                                                    <Plus size={16} color="#9ca3af" />
                                                </button>
                                            ))}
                                        {sections.filter(s => s.type === 'LEC').length === 0 && (
                                            <div style={{ padding: '0.5rem', color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>No lectures found (or only labs available).</div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Labs & Tutorials */}
                                {(() => {
                                    // 1. Find the currently selected lecture for this course in the schedule
                                    const scheduledItems = schedule.filter(c => c.courseCode === `${selectedDept} ${selectedCourse}`);

                                    // Try to find the lecture:
                                    // First check for explicit componentType 'LEC' (added in new logic)
                                    // Fallback to checking against sections list
                                    const selectedLecture = scheduledItems.find(item =>
                                        item.componentType === 'LEC' ||
                                        sections.find(s => s.text === item.section && s.type === 'LEC')
                                    );

                                    // Check if this course is "Lecture-less" (e.g. only labs - rare but possible)
                                    const hasLectures = sections.some(s => s.type === 'LEC');

                                    // Logic:
                                    // If course has lectures but none selected -> Show "Select Lecture first"
                                    // If course has lectures and one selected -> Show filtered labs
                                    // If course has NO lectures -> Show all labs immediately

                                    // 3. Filter Sections Logic
                                    // First, get all non-lecture sections (Labs, Tuts)
                                    let relevantSections = sections.filter(s => s.type !== 'LEC');

                                    // Apply User Filters (Campus, Time) - these are hard filters
                                    relevantSections = relevantSections.filter(s => {
                                        if (filters.campus.length > 0 && !filters.campus.includes(s.campus)) return false;
                                        return true;
                                    });
                                    // Apply Association Logic (Heuristic for D100 -> D101)
                                    // We only apply this matching if it yields results.
                                    // If strict matching hides ALL labs, we assume the heuristic is invalid for this course
                                    // (e.g. Lecture A, Lab 01) and fall back to showing all relevantSections.
                                    // Apply Association Logic (e.g., Lecture D100 -> Labs D101, D102)
                                    // 2. Strict Filtering Logic
                                    if (hasLectures && selectedLecture) {
                                        // Extract the actual section code (e.g., get "D100" out of "CMPT 201 D100")
                                        const fullText = (selectedLecture.section || '').trim().toUpperCase();
                                        const parts = fullText.split(' ');
                                        const sectionCode = parts[parts.length - 1]; // Grabs the last word (D100)

                                        // Get the Prefix (D or E)
                                        const lecPrefix = sectionCode.charAt(0);

                                        // Filter labs to ONLY those starting with the same letter
                                        relevantSections = relevantSections.filter(s => {
                                            const labText = (s.text || '').trim().toUpperCase();
                                            // This ensures "D101" matches "D", but "E101" does not
                                            return labText.startsWith(lecPrefix);
                                        });
                                    }

                                    // If there are no labs/tuts at all for this course, hide Step 2
                                    if (sections.filter(s => s.type !== 'LEC').length === 0) return null;

                                    return (
                                        <div className="animate-fade-in" style={{ marginTop: '0.5rem' }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a6192e', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Step 2: Select Lab / Tutorial {selectedLecture ? `(for ${selectedLecture.section})` : ''}
                                            </h4>

                                            {hasLectures && !selectedLecture ? (
                                                <div style={{ padding: '0.75rem', background: '#fff1f2', border: '1px dashed #e11d48', borderRadius: '6px', color: '#9f1239', fontSize: '0.8rem', textAlign: 'center' }}>
                                                    Please select a Lecture from Step 1 to see available Labs/Tutorials.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {relevantSections.map(s => (
                                                        <button key={s.value} onClick={() => addSection(s)} className="section-item">
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                                                                    <span className={`section-badge ${s.type?.toLowerCase() || 'lab'}`}>{s.type || 'LAB'}</span>
                                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.text}</span>
                                                                    {schedule.some(c => c.section === s.text) && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>✓ Added</span>}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                    {s.courseSchedule?.[0]?.days || 'TBA'} {s.courseSchedule?.[0]?.startTime}-{s.courseSchedule?.[0]?.endTime}
                                                                </div>
                                                            </div>
                                                            <Plus size={16} color="#9ca3af" />
                                                        </button>
                                                    ))}
                                                    {relevantSections.length === 0 && (
                                                        <div style={{ padding: '0.5rem', color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                            No compatible labs found matching section {selectedLecture?.section}. <br />
                                                            (Try a different lecture if available)
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
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

                    {/* Save Schedule Button */}
                    <button
                        onClick={handleSaveSchedule}
                        disabled={schedule.length === 0 || saving}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            background: saveStatus === 'success' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : schedule.length === 0 ? '#e5e7eb' : '#a6192e',
                            color: schedule.length === 0 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: schedule.length === 0 || saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Saving...
                            </>
                        ) : saveStatus === 'success' ? (
                            <>
                                <CheckCircle size={16} />
                                Saved!
                            </>
                        ) : saveStatus === 'error' ? (
                            <>
                                <AlertTriangle size={16} />
                                Failed to save
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {isSignedIn ? 'Save Schedule' : 'Sign in to Save'}
                            </>
                        )}
                    </button>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

                    {scheduleLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Loading your schedule...
                        </div>
                    ) : schedule.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            {isSignedIn ? 'No courses added yet' : 'Sign in to save and load your schedule'}
                        </p>
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
                        <div
                            key={day}
                            className="day-column"
                        >
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
                                                cursor: 'pointer'
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
