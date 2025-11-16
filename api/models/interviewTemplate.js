let templates = [];
let idCounter = 1;

const MOCK_TEMPLATES_DATA = [
  {
    jobTitle: 'Senior Frontend Developer',
    category: 'Software Engineering',
    experienceLevel: 'Senior',
    questions: [
      'Explain the difference between `let`, `const`, and `var` in JavaScript.',
      'What are Angular Signals and how do they improve change detection?',
      'Describe your experience with state management libraries like NgRx or Redux.',
      'How would you optimize a slow-loading web page?',
      'Discuss the importance of web accessibility (a11y).'
    ],
    type: 'technical',
    company: 'HussnainTechVertex Pvt Ltd.',
    authorId: '1', // Corresponds to super-admin user
    authorName: 'Hussnain',
  },
  {
    jobTitle: 'UX/UI Designer',
    category: 'UX/UI Design',
    experienceLevel: 'Mid-Level',
    questions: [
      'Walk me through your design process from concept to final handoff.',
      'How do you handle feedback from non-designers?',
      'What is your experience with user research and usability testing?',
      'Can you show me a project you are particularly proud of and explain why?'
    ],
    type: 'behavioral',
    company: 'HussnainTechVertex Pvt Ltd.',
    authorId: '1',
    authorName: 'Hussnain',
  },
  {
    jobTitle: 'Product Manager',
    category: 'Product Management',
    experienceLevel: 'Lead',
    questions: [
        'How do you prioritize features for a product roadmap?',
        'Describe a time you had to make a difficult decision with limited data.',
        'How do you define and measure success for a product?',
    ],
    type: 'situational',
    company: 'HussnainTechVertex Pvt Ltd.',
    authorId: '1',
    authorName: 'Hussnain',
  }
];

const initializeDefaultTemplates = () => {
    templates = MOCK_TEMPLATES_DATA.map(template => ({
        ...template,
        id: String(idCounter++),
        createdAt: new Date().toISOString()
    }));
};

initializeDefaultTemplates();

const InterviewTemplate = {
    findAll: async () => {
        return templates;
    },
    findById: async (id) => {
        return templates.find(t => t.id === id);
    },
    create: async (templateData) => {
        const newTemplate = {
            ...templateData,
            id: String(idCounter++),
            createdAt: new Date().toISOString()
        };
        templates.push(newTemplate);
        return newTemplate;
    },
    delete: async (id) => {
        const index = templates.findIndex(t => t.id === id);
        if (index > -1) {
            templates.splice(index, 1);
            return true;
        }
        return false;
    }
};

module.exports = InterviewTemplate;
