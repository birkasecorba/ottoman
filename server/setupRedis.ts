import redis from 'redis';
import util from 'util';

function setupRedis() {
  const redisClient = redis.createClient({
    host: process.env.REDIS_HOSTNAME,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASS,
  });

  redisClient.getAsync = util.promisify(redisClient.get);
  // redisClient.hget = util.promisify(redisClient.hget);

  redisClient.on('error', (err) => {
    console.log(`Redis connection error ${err}`);
  });

  redisClient.on('ready', () => {
    console.log('✅ 💃 redis have ready !');
  });

  redisClient.on('connect', () => {
    console.log('✅ 💃 connect redis success !');
  });

  return redisClient;
}

export default setupRedis;
