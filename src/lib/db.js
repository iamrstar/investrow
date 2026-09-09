import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js SRV lookup issues on macOS / local resolvers (EBADRESP)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if setServers fails
}

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
      serverSelectionTimeoutMS: 8000,
    };

    const mongoUri = process.env.MONGODB_URI;

    cached.promise = (async () => {
      if (mongoUri) {
        try {
          const conn = await mongoose.connect(mongoUri, opts);
          console.log('✅ MongoDB Connected successfully to:', mongoUri.split('@')[1] || mongoUri);
          return conn;
        } catch (err) {
          console.warn('⚠️ Could not connect to primary MongoDB (' + err.message + '). Falling back to in-memory MongoMemoryServer...');
        }
      }

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!global.__MONGO_MEMORY_SERVER__) {
          global.__MONGO_MEMORY_SERVER__ = await MongoMemoryServer.create();
        }
        const memUri = global.__MONGO_MEMORY_SERVER__.getUri();
        console.log('✅ Connected to in-memory MongoDB at:', memUri);
        const conn = await mongoose.connect(memUri, { bufferCommands: false });
        
        // Auto-seed default credentials if in-memory
        await seedDatabase();
        return conn;
      } catch (memErr) {
        console.error('❌ Failed to connect to in-memory MongoDB:', memErr);
        throw memErr;
      }
    })();
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


