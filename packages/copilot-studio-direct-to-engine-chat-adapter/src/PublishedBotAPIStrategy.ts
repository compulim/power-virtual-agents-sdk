/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { type HalfDuplexChatAdapterAPIStrategy } from './private/types/HalfDuplexChatAdapterAPIStrategy';

type PublishedBotAPIStrategyInit = {
  botSchema: string;
  environmentEndpointURL: URL;
  getTokenCallback: () => Promise<string>;
};

const API_VERSION = '2022-03-01-preview';

export default class PublishedBotAPIStrategy implements HalfDuplexChatAdapterAPIStrategy {
  constructor({ botSchema, environmentEndpointURL, getTokenCallback }: PublishedBotAPIStrategyInit) {
    this.#getTokenCallback = getTokenCallback;

    const url = new URL(
      `/powervirtualagents/dataverse-backed/authenticated/bots/${botSchema}/`,
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
