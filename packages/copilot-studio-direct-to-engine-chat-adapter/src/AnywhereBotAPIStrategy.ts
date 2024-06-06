import type { DirectLineBypassAPIStrategy } from './types/DirectLineBypassAPIStrategy';
import { UUID_REGEX, never, object, regex, special, string, type Output, type SpecialSchema } from 'valibot';
import { Strategy } from './types/Strategy';

const botManagementServiceTag = 'powervamg';

const AnywhereBotAPISchema = () =>
  object(
    {
      botIdentifier: string([regex(UUID_REGEX)]),
      islandURI: special(input => input instanceof URL) as SpecialSchema<URL>
    },
    never()
  );

type AnywhereBotStrategyInit = Output<ReturnType<typeof AnywhereBotAPISchema>>;

export default class AnywhereBotAPIStrategy implements DirectLineBypassAPIStrategy {
  #botIdentifier: string;
  #islandBaseUri: URL;

  constructor({ botIdentifier, islandURI }: AnywhereBotStrategyInit) {
    this.#botIdentifier = botIdentifier;
    this.#islandBaseUri = islandURI;
  }

  async #getHeaders() {
    return new Headers({ origin: 'https://web.powerva.microsoft.com' });
  }

  public async prepareExecuteTurn(): ReturnType<Strategy['prepareExecuteTurn']> {
    return {
      baseURL: await this.getUrl('')
    };
  }

  public async prepareStartNewConversation(): ReturnType<Strategy['prepareStartNewConversation']> {
    return {
      baseURL: await this.getUrl(''),
      headers: await this.#getHeaders()
    };
  }

  public async getHeaders() {
    return {};
  }

  public async getUrl(pathSuffix: string): Promise<URL> {
    if (/^[./]/u.test(pathSuffix)) {
      throw new Error('"pathSuffix" cannot start with a dot or slash.');
    }

    // https://msazure.visualstudio.com/CCI/_git/BotDesigner?path=%2Fsrc%2FInfrastructure%2FCommon%2FMicrosoft.CCI.Common%2FRouting%2FPVAServiceTags.cs&_a=contents&version=GBmaster
    const baseUrl = new URL(this.#islandBaseUri);

    if (baseUrl.host.startsWith(botManagementServiceTag)) {
      // remove the botManagementServiceTag
      const hostWithoutTag = baseUrl.host.substring(botManagementServiceTag.length);

      // add the runtimeServiceTag
      baseUrl.host = 'pvaruntime' + hostWithoutTag;
    }

    baseUrl.pathname = `/prebuilt/public/bots/${this.#botIdentifier}/${pathSuffix}`;

    return baseUrl;
  }

  public onRequestBody(requestType: 'continueTurn' | 'executeTurn' | 'startNewConversation', body: Readonly<unknown>) {
    if (requestType === 'startNewConversation') {
      return { ...body };
    }

    return body;
  }
}
