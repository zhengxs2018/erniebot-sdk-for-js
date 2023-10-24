import { APIClient } from '../client'

export class APIResource {
  protected get: APIClient['get']
  protected post: APIClient['post']
  protected patch: APIClient['patch']
  protected put: APIClient['put']
  protected delete: APIClient['delete']

  constructor(protected client: APIClient) {
    this.get = client.get.bind(client)
    this.post = client.post.bind(client)
    this.patch = client.patch.bind(client)
    this.put = client.put.bind(client)
    this.delete = client.delete.bind(client)
  }
}
