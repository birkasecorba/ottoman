import 'mongoose';
import 'redis';

declare module 'redis' {

  // eslint-disable-next-line no-undef
  export interface RedisClient extends NodeJS.EventEmitter {
    setAsync(key: string, value: string): Promise<void>;
    getAsync(key: string): Promise<string>;
  }
}

declare module 'mongoose' {

  // eslint-disable-next-line no-undef
  export interface Query extends NodeJS.EventEmitter {
    cache(ttl: number, customKey?: string): Query;
  }
}
