import {
  UUID_REGEX,
  never,
  object,
  regex,
  special,
  string,
  union,
  value,
  type Output,
  type SpecialSchema,
  type StringSchema
} from 'valibot';

import { type Strategy } from './types/Strategy';
import { type Transport } from './types/Transport';

const PublishedBotStrategyInitSchema = () =>
  object(
    {
      botSchema: string([regex(UUID_REGEX)]),
      environmentEndpointURL: special(input => input instanceof URL) as SpecialSchema<URL>,
      getToken: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>,
      transport: union([
        string([value('auto')]) as StringSchema<'auto'>,
        string([value('rest')]) as StringSchema<'rest'>
      ])
    },
    never()
  );

type PublishedBotStrategyInit = Output<ReturnType<typeof PublishedBotStrategyInitSchema>>;

const API_VERSION = '2022-03-01-preview';

export default class PublishedBotStrategy implements Strategy {
  constructor({ botSchema, environmentEndpointURL, getToken, transport }: PublishedBotStrategyInit) {
    this.#getToken = getToken;
    this.#transport = transport;

    const url = new URL(
      `/powervirtualagents/dataverse-backed/authenticated/bots/${botSchema}/`,
      environmentEndpointURL
    );

    url.searchParams.set('api-version', API_VERSION);

    this.#baseURL = url;
  }

  #baseURL: URL;
  #getToken: () => Promise<string>;
  #transport: Transport;

  async #getHeaders() {
    return new Headers({ authorization: `Bearer ${await this.#getToken()}` });
  }

  public async prepareExecuteTurn(): ReturnType<Strategy['prepareExecuteTurn']> {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders(), transport: this.#transport };
  }

  public async prepareStartNewConversation(): ReturnType<Strategy['prepareStartNewConversation']> {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders(), transport: this.#transport };
  }
}
