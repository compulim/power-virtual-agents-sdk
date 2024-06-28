import {
  UUID_REGEX,
  never,
  object,
  optional,
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

const TestCanvasBotStrategyInitSchema = () =>
  object(
    {
      botId: string([regex(UUID_REGEX)]),
      environmentId: string([regex(UUID_REGEX)]),
      getDeltaToken: optional(special(input => typeof input === 'function') as SpecialSchema<() => string | undefined>),
      getToken: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>,
      islandURI: special(input => input instanceof URL) as SpecialSchema<URL>,
      transport: union([
        string([value('auto')]) as StringSchema<'auto'>,
        string([value('rest')]) as StringSchema<'rest'>
      ])
    },
    never()
  );

type TestCanvasBotStrategyInit = Output<ReturnType<typeof TestCanvasBotStrategyInitSchema>>;

export default class TestCanvasBotStrategy implements Strategy {
  constructor({ botId, islandURI, environmentId, getDeltaToken, getToken, transport }: TestCanvasBotStrategyInit) {
    this.#getToken = getToken;

    this.#baseURL = new URL(`/environments/${encodeURI(environmentId)}/bots/${encodeURI(botId)}/test/`, islandURI);
    this.#getDeltaToken = getDeltaToken;
    this.#transport = transport;
  }

  #baseURL: URL;
  #getDeltaToken: (() => string | undefined) | undefined;
  #getToken: () => Promise<string>;
  #transport: Transport;

  async #getHeaders() {
    return new Headers({ authorization: `Bearer ${await this.#getToken()}` });
  }

  public async prepareExecuteTurn(): ReturnType<Strategy['prepareExecuteTurn']> {
    return {
      baseURL: this.#baseURL,
      body: { deltaToken: this.#getDeltaToken?.() },
      headers: await this.#getHeaders(),
      transport: this.#transport
    };
  }

  public async prepareStartNewConversation(): ReturnType<Strategy['prepareStartNewConversation']> {
    return {
      baseURL: this.#baseURL,
      body: { deltaToken: this.#getDeltaToken?.() },
      headers: await this.#getHeaders(),
      transport: this.#transport
    };
  }
}
