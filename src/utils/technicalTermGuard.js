

const technicalGroups = [
    ["bfs", "dfs"],
    ["stack", "queue"],
    ["sql", "nosql"],
    ["http", "https"],
    ["process", "thread"],
    ["array", "linked list"],
    ["memoization", "tabulation"],
    ["redis", "mongodb"]
];



const normalize = (text) => {
    return text
        .toLowerCase()
        .replace(/\bbreadth[\s-]+first search\b/g, "bfs")
        .replace(/\bdepth[\s-]+first search\b/g, "dfs")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
};


const containsTerm = (text, term) =>
    (` ${text} `).includes(` ${term} `);

export const hasTechnicalConflict = (question1, question2) => {
    const first = normalize(question1);
    const second = normalize(question2);

    for (const group of technicalGroups) {
        const firstTerms = group.filter((term) =>
            containsTerm(first, term)
        );

        const secondTerms = group.filter((term) =>
            containsTerm(second, term)
        );

        if (
            firstTerms.length === 1 &&
            secondTerms.length === 1 &&
            firstTerms[0] !== secondTerms[0]
        ) {
            return true;
        }
    }

    return false;
};
