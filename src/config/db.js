const { Pool } = require('pg')
const env = require('./env')

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
    console.log('Unexpected pool error', err)
    process.exit(-1)
})

const query = (text, params) => pool.query(text, params)

const getClient = () => pool.connect()

module.exports = { query, getClient, pool }