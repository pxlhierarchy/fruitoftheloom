import { createClient } from 'redis';

async function deleteUser() {
  try {
    const redis = createClient({
      url: 'redis://default:K6B7tB3pKe5okJMpUnKT2Q3yvcageTzr@redis-18068.c74.us-east-1-4.ec2.redns.redis-cloud.com:18068'
    });

    redis.on('error', (err) => console.error('Redis Client Error:', err));
    await redis.connect();

    const email = 'noventa16@hotmail.com';
    const userKey = `user:${email}`;
    
    console.log('Deleting user:', email);
    const result = await redis.del(userKey);
    
    if (result === 1) {
      console.log('User deleted successfully');
    } else {
      console.log('User not found or already deleted');
    }

    await redis.quit();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

deleteUser(); 