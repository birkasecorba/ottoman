/* eslint-disable new-cap */
import redis from 'redis';
import mongoose from 'mongoose';

type Props = {
  redisClient: redis.RedisClient
}

function setupMongoose({
  redisClient,
}: Props) {
  const url = `mongodb+srv://birkasecorba:${process.env.MONGO_PASS}@cluster0.to7hl.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
  mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    // we're connected!
    console.log('Mongoose connected');
  });

  mongoose.set('useFindAndModify', false);

  const { exec } = mongoose.Query.prototype;

  mongoose.Query.prototype.cache = function redisCache(ttl, customKey) {
    this._ttl = ttl;
    this._key = customKey;
    return this;
  };

  mongoose.Query.prototype.exec = async function mongooseExec(...rest) {
    if (!this._ttl) {
      return exec.apply(this, rest);
    }

    // const key = this._key || Hash.md5(JSON.stringify({
    //   name: this.model.collection.name,
    //   conditions: this._conditions,
    //   fields: this._fields,
    //   o: this.options,
    // }));

    redisClient.keys('*', async (err, keys) => {
      // ...
      Promise.all(keys.map((key) => redisClient.getAsync(key))).then((values) => {
        // ...
        console.log(`${values}`);
      });
    });

    console.log('_condiitons:', this._conditions, typeof this._conditions);
    console.log('_key:', this._key, typeof this._key);

    const key = String(this._key || this._conditions);
    console.log('key:', key, typeof key);

    const cached = await redisClient.getAsync(String(key));

    if (cached) {
      console.log('[LOG] CACHE hit');
      const doc = JSON.parse(cached);
      return Array.isArray(doc)
        ? doc.map((d) => new this.model(d))
        : new this.model(doc);
    }

    console.log('[LOG] cache miss');
    const result = await exec.apply(this, rest);
    if (result) {
      redisClient.set(key, JSON.stringify(result), 'EX', this._ttl);
    }
    return result;
  };

  return mongoose;
}

export default setupMongoose;
