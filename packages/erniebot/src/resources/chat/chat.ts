import { APIResource } from '../../resource'
import { Completions } from './completions'

export class Chat extends APIResource {
  completions: Completions = new Completions(this.client)
}
