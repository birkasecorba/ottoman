/* eslint-disable new-cap */
/* eslint-disable no-param-reassign */

export default function setup(redisClient, mongoose) {
  // update defaults
  mongoose.set('useFindAndModify', false);

  const { exec } = mongoose.Query.prototype;

  mongoose.Query.prototype.cache = function redisCache(ttl, customKey) {
    if (typeof ttl === 'string') {
      customKey = ttl;
      ttl = 60;
    }

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

    const cached = await redisClient.get(String(key));

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
}
