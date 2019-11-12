import redis = require('redis');

class Cache {
    private redisClient: any;
    private redisIsReady: boolean = false;

    constructor(redisClient: redis.RedisClient) {
        this.redisClient = redisClient;
        this.redisClient.on('ready', () => {
            this.redisIsReady = true; 
        });
    }

    async setCache(k: string, v: string, expireMillionSeconds?: number) : Promise<void> {
        if (!this.redisIsReady) {
            throw new Error('redis not ready')
        }
        await this.redisClient.setAsync(k, v);
        if (expireMillionSeconds == null || expireMillionSeconds == undefined) {
            return;
        }
        await this.redisClient.expireAsync(k, Math.floor(expireMillionSeconds / 1000));
    }
    
    async getCache(k: string) : Promise<string>{
        if (!this.redisIsReady) {
            throw new Error('redis not ready')
        }
        return await this.redisClient.getAsync(k);
    }

    async removeCache(k: string): Promise<void>{
        if (!this.redisIsReady) {
            throw new Error('redis not ready')
        }
        await this.redisClient.delAsync(k);
    }
}
export = Cache;