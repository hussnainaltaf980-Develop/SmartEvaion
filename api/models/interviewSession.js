let sessions = [];
let idCounter = 1;

const MOCK_SESSIONS_DATA = [
    {
        title: 'Frontend Practice - Q2 2024',
        userId: '2', // Corresponds to candidate user
        userName: 'John Doe',
        templateId: '1', // Corresponds to Senior Frontend Developer template
        jobTitle: 'Senior Frontend Developer',
        company: 'HussnainTechVertex Pvt Ltd.',
        status: 'approved',
        overallScore: 8.5,
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        overallFeedback: "John showed strong technical knowledge, especially in Angular and performance optimization. His communication was clear and confident. A great candidate.",
        overallStrengths: ["Deep Angular knowledge", "Strong problem-solving skills", "Clear communication"],
        overallAreasForImprovement: ["Could provide more detail on testing strategies."],
        results: [
            {
                questionId: 'q1',
                questionText: 'Explain the difference between `let`, `const`, and `var` in JavaScript.',
                transcript: 'Var is function-scoped, while let and const are block-scoped. Const cannot be reassigned.',
                evaluation: {
                    score: 9,
                    feedback: "Excellent, concise, and correct answer.",
                    metrics: {
                        accuracy: { score: 9, explanation: "The core differences were correctly identified." },
                        clarity: { score: 9, explanation: "The explanation was very clear." },
                        confidence: { score: 8, explanation: "Spoken with conviction." },
                    }
                },
                answeredOn: new Date().toISOString(),
            }
        ]
    },
    {
        title: 'Design Interview Prep',
        userId: '2', // candidate user
        userName: 'John Doe',
        templateId: '2', // UX/UI Designer template
        jobTitle: 'UX/UI Designer',
        company: 'HussnainTechVertex Pvt Ltd.',
        status: 'pending',
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        results: []
    }
];

const initializeDefaultSessions = () => {
    sessions = MOCK_SESSIONS_DATA.map(session => {
        const newSession = {
            ...session,
            id: String(idCounter++)
        };
        // Add sessionId to each result
        if (newSession.results) {
            newSession.results = newSession.results.map(r => ({ ...r, sessionId: newSession.id }));
        }
        return newSession;
    });
};

initializeDefaultSessions();

const InterviewSession = {
    findAll: async () => {
        return sessions;
    },
    findById: async (id) => {
        return sessions.find(s => s.id === id);
    },
    create: async (sessionData) => {
        const newSession = {
            ...sessionData,
            id: String(idCounter++),
            status: 'pending',
            results: [],
            startedAt: new Date().toISOString()
        };
        sessions.push(newSession);
        return newSession;
    },
    update: async (id, updateData) => {
        const sessionIndex = sessions.findIndex(s => s.id === id);
        if (sessionIndex === -1) {
            return null;
        }
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updateData };
        return sessions[sessionIndex];
    }
};

module.exports = InterviewSession;
