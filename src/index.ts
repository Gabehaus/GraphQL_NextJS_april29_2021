import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants"
import { Post } from "./entities/Post"
import microConfig from "./mikro-orm.config"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from "./resolvers/post"
import { UserResolver } from "./resolvers/user"
import redis from "redis"
import session from "express-session"
import connectRedis from "connect-redis"
import { MyContext } from "./types"

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true, //makes the cookie not accessble in the javascript code frontend
        sameSite: "lax", //related to protecting its csrf - not sure what that means
        secure: __prod__ // cookie only works in https, using __prod__ means only in production this is true
      },
      saveUninitialized: false, //only create and save a session if you are using it to store a property, not if it will remain an empty object that you don't use
      secret: "qiwuyewqiuyqwoiq",
      resave: false
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
  })

  apolloServer.applyMiddleware({ app })

  app.listen(4000, () => {
    console.log("server started on localhost:4000")
  })
}

main()

console.log("Hello Bob")
