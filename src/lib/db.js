import mongoose from 'mongoose';

/** 
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected successfully to:', mongoUri.split('@')[1]); // Log host for safety
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function seedDatabase() {
  try {
    const User = (await import('@/models/User')).default;
    const { hashPassword } = await import('@/lib/auth');

    const seedUsers = [
      { name: 'Admin User', email: 'admin@investrow.in', password: 'admin123', role: 'admin' },
      { name: 'Call Executive', email: 'user@investrow.in', password: 'user123', role: 'user' },
    ];

    const results = [];

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const user = await User.create({ 
          ...u, 
          password: await hashPassword(u.password), 
          plainPassword: u.password, 
          isActive: true 
        });
        results.push(`Created ${u.role}: ${u.email}`);
      } else {
        results.push(`Skipped ${u.role}: ${u.email} (exists)`);
      }
    }



    return { success: true, results };
  } catch (err) {
    console.error('Seed error:', err);
    return { success: false, error: err.message };
  }
}

export default dbConnect;


