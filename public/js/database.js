const { Client } = require('pg')
const connectionString = 'postgres://csblfmme:mn4_4uQAlhdrCM8MAM-jRZUJ-cBcCLJN@raja.db.elephantsql.com/csblfmme'

const client = new Client(connectionString)

client.connect();

module.exports={
    client
}