// Sample users. In a real application, passwords would never be stored in plain text like this.
// But for a seeder, this is fine because our User model will hash them upon saving.
const users = [
    {
    name: 'Super Admin',
    email: 'sadmin@gmail.com',
    password: '123456',
    role: 'super-admin',
  },
  {
    name: 'Master 1',
    email: 'master1@gmail.com',
    password: '123456',
    role: 'station-master',
  },
  {
    name: 'User 1',
    email: 'user1@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 2',
    email: 'user2@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 3',
    email: 'user3@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 4',
    email: 'user4@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 5',
    email: 'user5@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 6',
    email: 'user6@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'User 7',
    email: 'user7@gmail.com',
    password: '123456',
    role: 'user',
  },
  {
    name: 'Master 2',
    email: 'master2@gmail.com',
    password: '123456',
    role: 'station-master',
  }
];

export default users;