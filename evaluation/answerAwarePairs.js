
export const answerAwarePairs = [
    {
        incomingQuestion: "What is a binary search tree?",
        cachedQuestion: "What is a binary tree?",
        cachedAnswer: "A binary tree is a tree data structure where each node has at most two children.",
        expectedReuse: false
    },
    {
        incomingQuestion: "Explain the Java programming language.",
        cachedQuestion: "What is Java?",
        cachedAnswer: "Java is a high-level, object-oriented programming language used to build software applications.",
        expectedReuse: true
    },
    {
        incomingQuestion: "Explain authorization.",
        cachedQuestion: "Explain authentication.",
        cachedAnswer: "Authentication verifies the identity of a user.",
        expectedReuse: false
    },
    {
        incomingQuestion: "What is a stack?",
        cachedQuestion: "Explain the stack data structure.",
        cachedAnswer: "A stack is a linear data structure that follows the last-in, first-out principle.",
        expectedReuse: true
    },
    {
        incomingQuestion: "Explain DFS.",
        cachedQuestion: "Explain BFS.",
        cachedAnswer: "Breadth-first search explores graph nodes level by level using a queue.",
        expectedReuse: false
    },
    {
        incomingQuestion: "What is memoization?",
        cachedQuestion: "Explain memoization in dynamic programming.",
        cachedAnswer: "Memoization stores results of overlapping subproblems so they can be reused.",
        expectedReuse: true
    },
    {
        incomingQuestion: "Why do databases use indexes?",
        cachedQuestion: "What is database indexing?",
        cachedAnswer: "Database indexing creates data structures that accelerate record lookup and query execution, reducing the need to scan entire tables.",
        expectedReuse: true
    },
    {
        incomingQuestion: "Why do databases use indexes?",
        cachedQuestion: "What is database indexing?",
        cachedAnswer: "An index is a separate data structure maintained by a database.",
        expectedReuse: false
    }
];
