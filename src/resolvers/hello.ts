import { Resolver, Query } from "type-graphql"

@Resolver()
export class HelloResolver {
  @Query(() => String)
  hello() {
    return "howdy from your resolver query"
  }
}
