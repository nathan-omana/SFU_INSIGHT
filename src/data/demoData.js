// Demo Data for CMPT 225 - Data Structures and Programming
// This file contains hardcoded, polished content for demo purposes

export const CMPT_225_DATA = {
    // Course Modal Data
    course: {
        id: 'cmpt-225',
        code: 'CMPT 225',
        title: 'Data Structures and Programming',
        term: 'Spring 2026',
        description: 'Introduction to data structures and algorithms. Topics include: abstract data types, linked lists, stacks, queues, trees, hash tables, sorting, and graph algorithms. Implementation in C++.',
        metrics: {
            difficulty: 4.2,
            workload: 12,
            fairness: 3.8,
            clarity: 3.9,
            n: 347
        },
        assessment: [
            'Assignments (5): 30%',
            'Midterm Exam: 20%',
            'Final Exam: 50%'
        ],
        harderThanPrereqs: 78,
        tips: [
            'Start assignments at least 4-5 days early — debugging C++ pointers takes way longer than you think.',
            'The textbook (Koffman & Wolfgang) is actually useful. Read the chapters before lecture.',
            'Practice drawing out data structures by hand. It helps with understanding and exam prep.',
            'Go to office hours! TAs are super helpful with debugging segfaults.',
            'LeetCode Easy/Medium problems are great practice for the final.'
        ],
        resources: [
            { id: 'r1', type: 'YouTube', title: 'mycodeschool - Data Structures Playlist', url: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P', votes: 456 },
            { id: 'r2', type: 'YouTube', title: 'Abdul Bari - Algorithms', url: 'https://www.youtube.com/c/AbdulBari', votes: 312 },
            { id: 'r3', type: 'Notes', title: 'CMPT 225 Comprehensive Cheatsheet (2024)', url: '#', votes: 234 },
            { id: 'r4', type: 'Practice', title: 'LeetCode 225 Problem Set', url: 'https://leetcode.com/problemset/', votes: 189 },
            { id: 'r5', type: 'Notes', title: 'Big-O Complexity Reference', url: 'https://www.bigocheatsheet.com/', votes: 145 },
            { id: 'r6', type: 'Practice', title: 'Visualgo - DS Visualizations', url: 'https://visualgo.net/en', votes: 178 }
        ]
    },

    // Success Guide Data
    successGuide: {
        snapshot: {
            difficulty: 4,
            timeCommitment: '10–15 hours/week',
            assessmentStyle: 'Heavy on Coding Assignments',
            mathIntensity: 'Medium (Big-O analysis)',
            programming: 'C++ (with some theory)'
        },

        syllabi: [
            {
                term: 'Spring 2026',
                prof: 'Dr. Brian Fraser',
                topics: 'ADTs, Linked Lists, Stacks, Queues, Trees, BSTs, Heaps, Hash Tables, Graphs, Sorting'
            },
            {
                term: 'Fall 2025',
                prof: 'Igor Shinkar',
                topics: 'Same core topics with emphasis on recursion and time complexity analysis'
            },
            {
                term: 'Summer 2025',
                prof: 'Dr. Anne Lavergne',
                topics: 'Condensed coverage; extra focus on practical C++ implementation'
            }
        ],

        alumniNotes: [
            {
                title: 'Pointers & Memory Management Explained',
                description: 'Visual guide to C++ pointers, references, and dynamic memory. Includes common segfault causes.',
                tags: ['Must-Read', 'C++ Fundamentals'],
                upvotes: 4
            },
            {
                title: 'Recursion Patterns Cheatsheet',
                description: 'Common recursion patterns with examples: factorial, fibonacci, tree traversals, divide & conquer.',
                tags: ['Exam-Heavy', 'Quick Reference'],
                upvotes: 2
            },
            {
                title: 'Big-O Analysis Made Simple',
                description: 'How to analyze time and space complexity. Includes practice problems with solutions.',
                tags: ['Conceptual', 'Final Exam'],
                upvotes: 3
            },
            {
                title: 'Tree Traversal Visualizations',
                description: 'Step-by-step animations for inorder, preorder, postorder, and level-order traversals.',
                tags: ['Visual Guide', 'Midterm'],
                upvotes: 4
            },
            {
                title: 'Hash Tables Deep Dive',
                description: 'Collision resolution strategies, load factors, and when to use which approach.',
                tags: ['Advanced', 'Final Exam'],
                upvotes: 0
            }
        ],

        focusAreas: {
            green: [
                {
                    title: 'Linked List Operations',
                    description: 'Insertion, deletion at head/tail/middle. Understand pointer manipulation inside out.'
                },
                {
                    title: 'Tree Traversals (Recursive & Iterative)',
                    description: 'Know all four traversals cold. Be able to trace through examples by hand.'
                },
                {
                    title: 'Big-O Time Complexity Analysis',
                    description: 'Every data structure operation\'s complexity. This is tested on every exam.'
                },
                {
                    title: 'Stack & Queue Implementations',
                    description: 'Array-based and linked-list-based. Know the tradeoffs.'
                }
            ],
            yellow: [
                {
                    title: 'Heap Operations',
                    description: 'Understand heapify, insert, and extractMax. Know when to use heaps.'
                },
                {
                    title: 'Hash Table Collision Handling',
                    description: 'Linear probing vs chaining. Know the formulas but focus on concepts.'
                },
                {
                    title: 'Graph Representations',
                    description: 'Adjacency list vs matrix. Basic BFS/DFS understanding.'
                }
            ],
            red: [
                {
                    title: 'Advanced Graph Algorithms',
                    description: 'Dijkstra\'s and Prim\'s are covered briefly. Don\'t spend hours memorizing implementations.'
                },
                {
                    title: 'Red-Black Tree Rotations',
                    description: 'If covered, it\'s surface level. AVL/RB trees are not heavily tested.'
                },
                {
                    title: 'Amortized Analysis Proofs',
                    description: 'Mentioned but rarely tested in depth. Focus on understanding the concept.'
                }
            ]
        },

        resources: {
            videos: [
                {
                    title: 'mycodeschool - Data Structures',
                    description: 'Best playlist for visual learners. Clear animations for every topic.',
                    link: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P'
                },
                {
                    title: 'Abdul Bari - Algorithms',
                    description: 'Great for Big-O analysis and understanding why algorithms work.',
                    link: 'https://www.youtube.com/@abdul_bari'
                }
            ],
            readings: [
                {
                    title: 'Koffman & Wolfgang Textbook',
                    description: 'Official textbook. Chapters 5-8 are most important.',
                    link: '#'
                },
                {
                    title: 'GeeksforGeeks DS Articles',
                    description: 'Alternative explanations with code examples.',
                    link: 'https://www.geeksforgeeks.org/data-structures/'
                }
            ],
            practice: [
                {
                    title: 'LeetCode Easy/Medium',
                    description: 'Filter by: Arrays, Linked Lists, Trees, Stacks, Queues.',
                    link: 'https://leetcode.com/problemset/'
                },
                {
                    title: 'Visualgo Visualizations',
                    description: 'Interactive animations for every data structure.',
                    link: 'https://visualgo.net/en'
                },
                {
                    title: 'Past Midterms (SFU Vault)',
                    description: 'When available. Check the CS Student Society.',
                    link: '#'
                }
            ]
        },

        studentAdvice: [
            {
                quote: 'Start assignments the day they\'re released. I thought I could finish in a weekend and ended up pulling an all-nighter debugging a segfault.',
                author: 'CS Major, Spring 2025'
            },
            {
                quote: 'Draw everything out. I mean it. Draw linked lists, draw trees, draw the stack. It makes debugging 10x easier.',
                author: 'CS Student, Fall 2024'
            },
            {
                quote: 'The final is fair if you do the practice problems. It\'s not trying to trick you — just make sure you understand the concepts.',
                author: 'SFU Alum, 2024'
            },
            {
                quote: 'Go to office hours even if you don\'t have questions. Just seeing how TAs debug code teaches you so much.',
                author: 'CS Major, Summer 2025'
            }
        ]
    },

    // Professors who teach CMPT 225
    professors: [
        {
            id: 'prof-amirhossein-mozafari-khameneh',
            name: 'Amirhossein Mozafari Khameneh',
            dept: 'CMPT',
            course: 'CMPT 225',
            rating: 4.7,
            difficulty: 3.8,
            wouldTakeAgain: 92,
            tags: ['Amazing Lectures', 'Helpful', 'Clear Explanations', 'Tough but Fair'],
            topReview: 'Best professor I\'ve had at SFU. Makes data structures genuinely interesting.'
        },
        {
            id: 'prof-diana-cukierman',
            name: 'Diana Cukierman',
            dept: 'CMPT',
            course: 'CMPT 225',
            rating: 4.2,
            difficulty: 4.0,
            wouldTakeAgain: 85,
            tags: ['Organized', 'Responds to Emails', 'Fair Grading'],
            topReview: 'Very organized and cares about students. Exams are challenging but fair.'
        },
        {
            id: 'prof-anne-lavergne',
            name: 'Anne Lavergne',
            dept: 'CMPT',
            course: 'CMPT 225',
            rating: 4.5,
            difficulty: 3.5,
            wouldTakeAgain: 88,
            tags: ['Patient', 'Great Slides', 'Approachable'],
            topReview: 'Super approachable and explains things clearly. Highly recommend.'
        }
    ],

    // Reviews shown in the modal
    reviews: [
        {
            author: 'Anonymous',
            date: '2 weeks ago',
            rating: 4,
            comment: 'Challenging but rewarding. The assignments are time-consuming but you learn a lot. Start early!',
            helpful: 45
        },
        {
            author: 'CS Student',
            date: '1 month ago',
            rating: 5,
            comment: 'Best CS course so far. Finally understood why data structures matter. Fraser is an amazing prof.',
            helpful: 67
        },
        {
            author: 'Anonymous',
            date: '2 months ago',
            rating: 3,
            comment: 'Content is good but the workload is heavy. Make sure you have time to dedicate to this course.',
            helpful: 23
        }
    ]
};

// Helper to check if a course code matches CMPT 225
export const isCMPT225 = (code) => {
    if (!code) return false;
    return code.toUpperCase().replace(/\s+/g, ' ').trim() === 'CMPT 225';
};

// Get demo data for a course (returns null if not CMPT 225)
export const getDemoData = (courseCode) => {
    if (isCMPT225(courseCode)) {
        return CMPT_225_DATA;
    }
    return null;
};
