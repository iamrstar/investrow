import dbConnect, { seedDatabase } from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    const result = await seedDatabase();
    
    if (result.success) {
      return Response.json({
        status: 'success',
        message: 'Database seeded successfully',
        details: result.results,
        timestamp: new Date().toISOString()
      });
    } else {
      return Response.json({
        status: 'error',
        message: 'Seeding failed',
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
