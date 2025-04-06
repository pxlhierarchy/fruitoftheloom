import { createClient } from 'redis';

async function checkUser() {
  try {
    const redis = createClient({
      url: 'redis://default:K6B7tB3pKe5okJMpUnKT2Q3yvcageTzr@redis-18068.c74.us-east-1-4.ec2.redns.redis-cloud.com:18068'
    });

    redis.on('error', (err) => console.error('Redis Client Error:', err));
    await redis.connect();

    const email = 'noventa16@hotmail.com';
    const userKey = `user:${email}`;
    
    console.log('Checking for user:', email);
    const userData = await redis.get(userKey);
    
    if (userData) {
      console.log('User found:', JSON.parse(userData));
    } else {
      console.log('User not found');
    }

    await redis.quit();
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUser(); 