
export const heldOutPairs = [
    {
        question1: "How does binary search work?",
        question2: "Explain the binary search algorithm.",
        expectedMatch: true
    },
    {
        question1: "How does binary search work?",
        question2: "Explain linear search.",
        expectedMatch: false
    },
    {
        question1: "What is a mutex?",
        question2: "Explain mutual exclusion locks.",
        expectedMatch: true
    },
    {
        question1: "What is a mutex?",
        question2: "What is a semaphore?",
        expectedMatch: false
    },
    {
        question1: "What is database indexing?",
        question2: "Why do databases use indexes?",
        expectedMatch: false
    },
    {
        question1: "What is database indexing?",
        question2: "Explain database indexes.",
        expectedMatch: true
    },
    {
        question1: "Explain authentication.",
        question2: "Explain authorization.",
        expectedMatch: false
    },
    {
        question1: "What is a hash table?",
        question2: "Explain hash maps.",
        expectedMatch: true
    },
    {
        question1: "What is a hash table?",
        question2: "What is a hash function?",
        expectedMatch: false
    },
    {
        question1: "Explain TCP.",
        question2: "Explain UDP.",
        expectedMatch: false
    },
    {
        question1: "Explain time complexity.",
        question2: "What is Big O notation?",
        expectedMatch: false
    },
    {
        question1: "What is recursion?",
        question2: "Explain recursive functions.",
        expectedMatch: true
    }
];
