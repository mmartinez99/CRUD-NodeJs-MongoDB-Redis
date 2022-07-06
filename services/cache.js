const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);//conn Redis

mongoose.Query.prototype.cache = function (hkey) { //useCache -> appelé par cache() dans app.js
    this.useCache = true;
    this.hashkey = JSON.stringify(hkey || '')
    return this;
}


const exec = mongoose.Query.prototype.exec //.exec fournit par mongoose

//Remplace la fonction exec par Redis avant
mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments)
    }

    let key = JSON.stringify(Object.assign({}, this.getQuery(), {collection: this.mongooseCollection.name}));

    const cacheValue = await client.hget(this.hashkey, key) // recup donnée cache

    if (cacheValue) {
        const doc = JSON.parse(cacheValue)
        return Array.isArray(doc)
            ? doc.map((d) => new this.model(d))
            : new this.model(doc);
        console.log('Return data from Redis');

    }

    //Les datas pas presente dans redis,
    // On recupere les données de Mongodb et on sauvegarde dans redis.
    const result = await exec.apply(this, arguments)

    if (result) {
        if (Array.isArray(result) && result.length == 0) {
            return null
        } else {
            client.hset(this.hashkey, key, JSON.stringify(result)); // save donnée dans redis
            console.log('Return data from Mongo');
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