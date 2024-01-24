/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { Output, SpecialSchema, UUID_REGEX, never, object, regex, special, string, url } from 'valibot';
import { type HalfDuplexChatAdapterAPIStrategy } from './private/types/HalfDuplexChatAdapterAPIStrategy';

const TestCanvasBotAPIStrategyInitSchema = () =>
  object(
    {
      botId: string([regex(UUID_REGEX)]),
      environmentEndpointURL: string([url()]),
      environmentId: string([regex(UUID_REGEX)]),
      getTokenCallback: special(input => typeof input === 'function') as SpecialSchema<() => Promise<string>>
    },
    never()
  );

type TestCanvasBotAPIStrategyInit = Output<ReturnType<typeof TestCanvasBotAPIStrategyInitSchema>>;

const API_VERSION = '2022-03-01-preview';

export default class TestCanvasBotAPIStrategy implements HalfDuplexChatAdapterAPIStrategy {
  constructor({ botId, environmentEndpointURL, environmentId, getTokenCallback }: TestCanvasBotAPIStrategyInit) {
    this.#getTokenCallback = getTokenCallback;

    const url = new URL(
      `/environments/${encodeURI(environmentId)}/bots/${encodeURI(botId)}/conversations/`,
      environmentEndpointURL
    );

    url.searchParams.set('api-version', API_VERSION);

    this.#baseURL = url;
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
