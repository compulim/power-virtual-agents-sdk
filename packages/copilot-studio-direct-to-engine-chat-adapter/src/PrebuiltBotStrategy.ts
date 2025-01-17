import { function_, instance, literal, object, parse, pipe, string, transform, union, type InferOutput } from 'valibot';

import { type Strategy } from './types/Strategy';
import { type Transport } from './types/Transport';

type PrebuiltBotStrategyInit = Readonly<InferOutput<typeof prebuiltBotStrategyInitSchema>>;
type Token = InferOutput<typeof tokenSchema>;

const prebuiltBotStrategyInitSchema = object({
  botIdentifier: string('botIdentifier must be a string'),
  environmentEndpointURL: instance(URL, 'environmentEndpointURL must be instance of URL'),
  getToken: pipe(
    function_('getToken must be a function'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform<() => any, () => Promise<Token>>(input => input)
  ),
  transport: union([literal('auto'), literal('rest')], 'transport must be either "auto" or "rest"')
});
const tokenSchema = string('getToken must return a string');

const API_VERSION = '2022-03-01-preview';

export default class PublishedBotStrategy implements Strategy {
  constructor(init: PrebuiltBotStrategyInit) {
    const { botIdentifier, environmentEndpointURL, getToken, transport } = parse(prebuiltBotStrategyInitSchema, init);

    this.#getToken = async () => parse(tokenSchema, await getToken());
    this.#transport = transport;

    const url = new URL(`/powervirtualagents/prebuilt/authenticated/bots/${botIdentifier}/`, environmentEndpointURL);

    url.searchParams.set('api-version', API_VERSION);

    this.#baseURL = url;
  }

  #baseURL: URL;
  #getToken: () => Promise<Token>;
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

export type { PrebuiltBotStrategyInit };
