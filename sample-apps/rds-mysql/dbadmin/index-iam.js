const AWSXRay = require('aws-xray-sdk-core')
const captureMySQL = require('aws-xray-sdk-mysql')
const mysql = captureMySQL(require('mysql2'))
const AWS = require('aws-sdk')
const username = process.env.databaseUser
const password = process.env.databasePassword
const host = process.env.databaseHost
const region = process.env.AWS_REGION
const sqlport = 3306

const signer = new AWS.RDS.Signer({
  region: region,
  hostname: host,
  port: sqlport,
  username: username
})
const rdsSignerAuth = () => () => {
  return signer.getAuthToken({
    username,
    region,
    host,
    port: sqlport
  })
}

exports.handler = async (event) => {
    let connectionConfig = {
        host     : host,
        user     : username,
        database : 'lambdadb',
        ssl: 'Amazon RDS',
        authPlugins: { mysql_clear_password: rdsSignerAuth }
    }
    var connection = mysql.createConnection(connectionConfig)
    var query = event.query
    var result
    connection.connect()

    connection.query(query, function (error, results, fields) {
      if (error) throw error
      console.log("Ran query: " + query)
      for (result in results)
        console.log(results[result])
    })

    return new Promise( ( resolve, reject ) => {
        connection.end( err => {
            if ( err )
                return reject( err )
            const response = {
                statusCode: 200,
                body: JSON.stringify(result),
            }
            resolve(response)
        })
    })
}
