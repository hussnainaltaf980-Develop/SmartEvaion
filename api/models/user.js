
// api/models/user.js
const bcrypt = require('bcryptjs');

// In-memory data store to simulate a database
let users = [];
let idCounter = 1;

// Function to initialize default users
const initializeDefaultUsers = () => {
    // Use synchronous bcrypt methods for initial setup to avoid race conditions
    const salt = bcrypt.genSaltSync(10);
    
    // Hash for the specific owner password 'Romio@47'
    const ownerPasswordHash = bcrypt.hashSync('Romio@47', salt);
    
    // Hash for generic users
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    users = [
        {
            id: String(idCounter++),
            email: 'hussnainmr07@gmail.com',
            password: ownerPasswordHash,
            role: 'super-admin',
            name: 'Hussnain (Owner)',
            companyName: 'HussnainTechVertex',
            disabled: false,
            photoUrl: 'https://ui-avatars.com/api/?name=Hussnain&background=0D8ABC&color=fff'
        },
        {
            id: String(idCounter++),
            email: 'candidate@example.com',
            password: defaultPasswordHash,
            role: 'candidate',
            name: 'John Doe',
            fatherName: 'Richard Doe',
            gender: 'male',
            dob: '1995-08-15',
            cnic: '12345-6789012-3',
            mobile: '+15551234567',
            photoUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
            disabled: false,
        }
    ];
};

// Immediately initialize the users when the module is loaded
initializeDefaultUsers();

// Model functions
const User = {
  // Find a user by their email address
  findByEmail: async (email) => {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Find a user by their ID
  findById: async (id) => {
    return users.find(user => user.id === id);
  },

  // Create a new user
  create: async (userData) => {
    const newUser = {
      id: String(idCounter++),
      disabled: false,
      ...userData,
    };
    users.push(newUser);
    return newUser;
  },

  // Update a user by ID
  update: async (id, updateData) => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }
    // Make sure not to update the ID
    delete updateData.id;
    // Don't allow password to be updated through this generic method
    delete updateData.password;

    users[userIndex] = { ...users[userIndex], ...updateData };
    return users[userIndex];
  },
  
  // Get all users (for potential admin features)
  findAll: async () => {
    return users;
  }
};

module.exports = User;
