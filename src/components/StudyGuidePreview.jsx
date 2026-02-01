import React from 'react';
import { X, Download, BookOpen, Code, GitBranch, Hash, Binary } from 'lucide-react';

// Sample content for each study guide topic
const STUDY_GUIDE_CONTENT = {
    'Pointers & Memory Management Explained': {
        icon: Code,
        sections: [
            {
                title: 'What is a Pointer?',
                content: `A pointer is a variable that stores the memory address of another variable. Think of it as a "reference" to where data lives in memory.

int x = 42;       // Regular variable
int* ptr = &x;    // Pointer storing address of x
cout << *ptr;     // Dereference: prints 42`
            },
            {
                title: 'Common Pointer Operations',
                content: `• & (Address-of): Gets memory address of a variable
• * (Dereference): Accesses value at an address
• -> (Arrow): Access member through pointer

Node* node = new Node();
node->data = 5;    // Same as (*node).data = 5`
            },
            {
                title: 'Dynamic Memory (new/delete)',
                content: `// Allocating single value
int* p = new int(10);
delete p;

// Allocating array
int* arr = new int[100];
delete[] arr;  // Note the [] for arrays!

⚠️ ALWAYS delete what you new!`
            },
            {
                title: 'Common Segfault Causes',
                content: `1. Dereferencing nullptr
2. Accessing deleted memory (dangling pointer)
3. Array out of bounds
4. Forgetting to allocate before use
5. Double delete

Pro tip: Set pointers to nullptr after deleting!`
            }
        ]
    },
    'Recursion Patterns Cheatsheet': {
        icon: GitBranch,
        sections: [
            {
                title: 'Recursion Template',
                content: `Every recursion needs:
1. BASE CASE - when to stop
2. RECURSIVE CASE - call itself with smaller input
3. PROGRESS - must move toward base case

int factorial(int n) {
    if (n <= 1) return 1;        // Base
    return n * factorial(n-1);   // Recursive
}`
            },
            {
                title: 'Tree Traversals',
                content: `// INORDER (Left, Root, Right) - sorted for BST
void inorder(Node* n) {
    if (!n) return;
    inorder(n->left);
    visit(n);
    inorder(n->right);
}

// PREORDER (Root, Left, Right) - copy tree
// POSTORDER (Left, Right, Root) - delete tree`
            },
            {
                title: 'Divide & Conquer Pattern',
                content: `1. DIVIDE: Split problem in half
2. CONQUER: Solve smaller problems
3. COMBINE: Merge solutions

Used in: Merge Sort, Quick Sort, Binary Search

int binarySearch(arr, target, lo, hi) {
    if (lo > hi) return -1;
    int mid = (lo + hi) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] > target)
        return binarySearch(arr, target, lo, mid-1);
    return binarySearch(arr, target, mid+1, hi);
}`
            },
            {
                title: 'Common Mistakes',
                content: `❌ Missing base case → infinite recursion
❌ Not making progress → stack overflow
❌ Wrong return value propagation
❌ Modifying shared state incorrectly

✅ Always trace through small examples by hand!`
            }
        ]
    },
    'Big-O Analysis Made Simple': {
        icon: Hash,
        sections: [
            {
                title: 'Big-O Cheat Sheet',
                content: `O(1)       Constant    Array access, hash lookup
O(log n)   Logarithmic Binary search, balanced BST
O(n)       Linear      Simple loop, linear search
O(n log n) Linearithmic Merge sort, heap sort
O(n²)      Quadratic   Nested loops, bubble sort
O(2ⁿ)      Exponential Recursive fibonacci (naive)`
            },
            {
                title: 'How to Analyze',
                content: `1. Count the loops:
   - Single loop over n → O(n)
   - Nested loops over n → O(n²)
   - Loop halving each time → O(log n)

2. Drop constants: O(3n) → O(n)

3. Drop lower terms: O(n² + n) → O(n²)

4. Worst case matters most!`
            },
            {
                title: 'Data Structure Operations',
                content: `Array:       Access O(1), Search O(n), Insert O(n)
Linked List: Access O(n), Search O(n), Insert O(1)
BST:         All O(log n) average, O(n) worst
Hash Table:  All O(1) average, O(n) worst
Heap:        Insert O(log n), Extract O(log n)`
            },
            {
                title: 'Space Complexity',
                content: `Don't forget about space!

• Recursive calls use stack space
• Creating new arrays = O(n) space
• In-place algorithms = O(1) space

Merge Sort: O(n) space
Quick Sort: O(log n) space average
Heap Sort:  O(1) space ✓`
            }
        ]
    },
    'Tree Traversal Visualizations': {
        icon: Binary,
        sections: [
            {
                title: 'Sample Tree',
                content: `        [10]
       /    \\
     [5]    [15]
    /  \\      \\
  [3]  [7]   [20]

Inorder:   3, 5, 7, 10, 15, 20
Preorder:  10, 5, 3, 7, 15, 20
Postorder: 3, 7, 5, 20, 15, 10
Level:     10, 5, 15, 3, 7, 20`
            },
            {
                title: 'When to Use Each',
                content: `INORDER - BST sorted output
  "Visit nodes in sorted order"

PREORDER - Copy/serialize tree
  "Process parent before children"

POSTORDER - Delete tree, evaluate expressions
  "Process children before parent"

LEVEL-ORDER - BFS, find shortest path
  "Process level by level (use queue)"`
            },
            {
                title: 'Iterative Inorder (Stack)',
                content: `vector<int> inorder(Node* root) {
    vector<int> result;
    stack<Node*> s;
    Node* curr = root;
    
    while (curr || !s.empty()) {
        while (curr) {
            s.push(curr);
            curr = curr->left;
        }
        curr = s.top(); s.pop();
        result.push_back(curr->val);
        curr = curr->right;
    }
    return result;
}`
            },
            {
                title: 'Level Order (Queue)',
                content: `void levelOrder(Node* root) {
    if (!root) return;
    queue<Node*> q;
    q.push(root);
    
    while (!q.empty()) {
        Node* curr = q.front();
        q.pop();
        visit(curr);
        if (curr->left) q.push(curr->left);
        if (curr->right) q.push(curr->right);
    }
}`
            }
        ]
    },
    'Hash Tables Deep Dive': {
        icon: Hash,
        sections: [
            {
                title: 'How Hash Tables Work',
                content: `1. Hash function converts key → index
2. Store value at that index
3. Handle collisions when keys hash same

hash("apple") → 7
table[7] = "fruit"

Good hash: uniform distribution, fast to compute`
            },
            {
                title: 'Collision Resolution',
                content: `CHAINING (Linked Lists):
• Each bucket is a linked list
• Collisions just add to list
• Simple but uses more memory

OPEN ADDRESSING:
• Linear Probing: try next slot
• Quadratic Probing: try i² slots away
• Double Hashing: use second hash function`
            },
            {
                title: 'Load Factor',
                content: `Load Factor (λ) = n / table_size

λ < 0.5  → Good performance
λ > 0.7  → Time to resize!
λ > 1.0  → Chaining only

When resizing:
1. Create new table (typically 2x size)
2. Rehash ALL existing elements
3. O(n) operation but amortized O(1)`
            },
            {
                title: 'Time Complexity',
                content: `Average Case: O(1) for all operations!
Worst Case:   O(n) when all keys collide

To avoid worst case:
• Use good hash function
• Keep load factor low
• Choose prime table sizes

std::unordered_map uses hash table ✓`
            }
        ]
    }
};

export default function StudyGuidePreview({ note, onClose }) {
    if (!note) return null;

    const content = STUDY_GUIDE_CONTENT[note.title] || {
        icon: BookOpen,
        sections: [
            {
                title: 'Study Notes',
                content: `These are sample study notes for ${note.title}.\n\nCommunity-contributed content would appear here with detailed explanations, examples, and practice problems.`
            }
        ]
    };

    const Icon = content.icon;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '700px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #a6192e 0%, #7a1322 100%)',
                    padding: '24px',
                    color: 'white',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Icon size={28} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>{note.title}</h2>
                            <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0' }}>CMPT 225 Study Guide</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {note.tags?.map(tag => (
                            <span key={tag} style={{
                                fontSize: '12px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '4px 12px',
                                borderRadius: '20px'
                            }}>
                                {tag}
                            </span>
                        ))}
                        <span style={{
                            fontSize: '12px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '4px 12px',
                            borderRadius: '20px'
                        }}>
                            👍 {note.upvotes} upvotes
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    padding: '24px',
                    maxHeight: 'calc(90vh - 200px)',
                    overflowY: 'auto'
                }}>
                    {content.sections.map((section, i) => (
                        <div key={i} style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#a6192e',
                                marginBottom: '12px',
                                paddingBottom: '8px',
                                borderBottom: '2px solid #f3f4f6'
                            }}>
                                {section.title}
                            </h3>
                            <pre style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                color: '#334155',
                                margin: 0,
                                overflow: 'auto'
                            }}>
                                {section.content}
                            </pre>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Contributed by SFU students • Community verified
                    </span>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#a6192e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>
                        <Download size={16} />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
