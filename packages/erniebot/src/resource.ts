import { ERNIEBot } from './index'

export class APIResource {
  protected get: ERNIEBot['get']
  protected post: ERNIEBot['post']
  protected patch: ERNIEBot['patch']
  protected put: ERNIEBot['put']
  protected delete: ERNIEBot['delete']

  constructor(protected client: ERNIEBot) {
    this.get = client.get.bind(client)
    this.post = client.post.bind(client)
    this.patch = client.patch.bind(client)
    this.put = client.put.bind(client)
    this.delete = client.delete.bind(client)
  }
}
