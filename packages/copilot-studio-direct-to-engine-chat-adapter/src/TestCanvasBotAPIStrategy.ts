/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { Output, SpecialSchema, UUID_REGEX, never, object, regex, special, string } from 'valibot';
import { type HalfDuplexChatAdapterAPIStrategy } from './private/types/HalfDuplexChatAdapterAPIStrategy';

const TestCanvasBotAPIStrategyInitSchema = () =>
  object(
    {
      botId: string([regex(UUID_REGEX)]),
      environmentId: string([regex(UUID_REGEX)]),
      getTokenCallback: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>,
      islandURI: special(input => input instanceof URL) as SpecialSchema<URL>
    },
    never()
  );

type TestCanvasBotAPIStrategyInit = Output<ReturnType<typeof TestCanvasBotAPIStrategyInitSchema>>;

export default class TestCanvasBotAPIStrategy implements HalfDuplexChatAdapterAPIStrategy {
  constructor({ botId, islandURI, environmentId, getTokenCallback }: TestCanvasBotAPIStrategyInit) {
    this.#getTokenCallback = getTokenCallback;

    this.#baseURL = new URL(`/environments/${encodeURI(environmentId)}/bots/${encodeURI(botId)}/test/`, islandURI);
  }

  #baseURL: URL;
  #getTokenCallback: () => Promise<string>;

  async #getHeaders() {
    return { authorization: `Bearer ${await this.#getTokenCallback()}` };
  }

  public async prepareExecuteTurn(): ReturnType<HalfDuplexChatAdapterAPIStrategy['prepareExecuteTurn']> {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders() };
  }

  public async prepareStartNewConversation(): ReturnType<
    HalfDuplexChatAdapterAPIStrategy['prepareStartNewConversation']
  > {
    return { baseURL: this.#baseURL, headers: await this.#getHeaders() };
  }
}
