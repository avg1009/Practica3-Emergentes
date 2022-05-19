//server.js

const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const cors = require('cors')
const compression = require('compression')

const {root, schema, sse} = require('./controllers')

const app = express()

app.use(cors())

app.use('/graphql', graphqlHTTP({
  rootValue: root, 
  schema: schema, 
  graphiql: true //only for testing
}))

//Static content (web app)
app.use('/web',  express.static('public'))

//Endpoint for SSE stream
app.use( compression() )
app.use('/news', sse.eventStream)

app.listen(8080, () => console.log('Listening on 8080'))

