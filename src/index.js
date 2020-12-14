const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')
const jwt = require('jsonwebtoken')
const helmet = require('helmet')
const cors = require('cors')
const db = require('./db')
const models = require('./models')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
require('dotenv').config()

const port = process.env.PORT || 4000
const DB_HOST = process.env.DB_HOST

const app = express()

app.use(helmet())
app.use(cors())

db.connect(DB_HOST)

const getUser = token => {
  if (token) {
    try {
      // return the user information from the token
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      // if there's a problem with the token, throw an error
      throw new Error('Session invalid')
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit[5], createComplexityLimitRule(1000)],
  context: async ({ req }) => {
    const token = req.headers.authorization
    const user = getUser(token)

    return { models, user }
  }
})

server.applyMiddleware({ app, path: '/api' })

app.listen(port, () => console.log(
  `GraphQL Server running at
 http://localhost:${port}${server.graphqlPath}`
))
