export const evaluationDataset = [
    {
        question1: "What is Java?",
        question2: "Explain the Java programming language.",
        expectedMatch: true
    },
    {
        question1: "What is a binary tree?",
        question2: "Define a binary tree.",
        expectedMatch: true
    },
    {
        question1: "What is a binary tree?",
        question2: "What is a binary search tree?",
        expectedMatch: false
    },
    {
        question1: "Explain breadth-first search.",
        question2: "What is BFS in graph traversal?",
        expectedMatch: true
    },
    {
        question1: "Explain breadth-first search.",
        question2: "Explain depth-first search.",
        expectedMatch: false
    },
    {
        question1: "What is a stack data structure?",
        question2: "Explain the LIFO principle of stacks.",
        expectedMatch: true
    },
    {
        question1: "What is a stack data structure?",
        question2: "What is a queue data structure?",
        expectedMatch: false
    },
    {
        question1: "What is SQL?",
        question2: "Explain Structured Query Language.",
        expectedMatch: true
    },
    {
        question1: "What is SQL?",
        question2: "What is NoSQL?",
        expectedMatch: false
    },
    {
        question1: "What is process synchronization?",
        question2: "Explain synchronization between concurrent processes.",
        expectedMatch: true
    }
];