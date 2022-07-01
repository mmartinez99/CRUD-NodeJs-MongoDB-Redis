const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = function (hkey) {
    this.useCache = true;
    this.hashkey = JSON.stringify(hkey || '')
    return this;
}


const exec = mongoose.Query.prototype.exec
//exec fournit par mongoose
mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments)
    }

    let key = JSON.stringify(Object.assign({}, this.getQuery(), {collection: this.mongooseCollection.name}));

    const cacheValue = await client.hget(this.hashkey, key)

    if (cacheValue) {
        const doc = JSON.parse(cacheValue)
        return Array.isArray(doc)
            ? doc.map((d) => new this.model(d))
            : new this.model(doc);
    }

    //Les datas pas presente dans redis,
    // On recupere les données de Mongodb et on sauvegarde dans redis.
    const result = await exec.apply(this, arguments)

    if (result) {
        if (Array.isArray(result) && result.length == 0) {
            return null
        } else {
            client.hset(this.hashkey, key, JSON.stringify(result)); // save donnée dans redis
            return result
        }
    } else {
        console.log("data not present")
        return null
    }
}

module.exports =
    function clearCache(hashkey) { // Suppr dans Redis
        client.del(JSON.stringify(hashkey))
    }