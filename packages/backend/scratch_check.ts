import bcrypt from 'bcryptjs';
import sequelize from '../src/config/database.js';
import User from '../src/models/User.js';

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    const user = await User.findOne({ where: { email: 'demo@example.com' } });
    if (!user) {
      console.log('User NOT found!');
    } else {
      console.log('User found:', user.email);
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password match:', isMatch);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
