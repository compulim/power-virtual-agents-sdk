import express from 'express';
import { createServer } from 'http';
import {
  UUID_REGEX,
  fallback,
  object,
  parse,
  regex,
  string,
  transform,
  undefined_,
  union,
  unknown,
  value,
  type StringSchema
} from 'valibot';

const { port } = parse(object({ port: fallback(string([regex(/^\d+$/u)]), '3978') }), process.env);

const BASE_URL = new URL('https://pvaruntime.us-il102.gateway.prod.island.powerapps.com/');

const app = express();
const server = createServer(app);

const ResponseSchema = object(
  {
    action: union([
      string([value('continue')]) as StringSchema<'continue'>,
      string([value('waiting')]) as StringSchema<'waiting'>
    ])
  },
  unknown()
);

const RequestParamsSchema = object({
  botId: string([regex(UUID_REGEX)]),
  conversationId: union([string(), undefined_()]),
  environmentId: string([regex(UUID_REGEX)]),
  turn: union([
    transform(undefined_(), () => ''),
    string([value('')]) as StringSchema<''>,
    string([value('continue')]) as StringSchema<'continue'>,
    string([value('execute')]) as StringSchema<'execute'>
  ])
});

app.get('/health.txt', (_, res) => res.send('OK'));

app.use(express.json());

app.options(
  [
    '/environments/:environmentId/bots/:botId/test/conversations',
    '/environments/:environmentId/bots/:botId/test/conversations/:conversationId',
    '/environments/:environmentId/bots/:botId/test/conversations/:conversationId/:turn'
  ],
  async (req, res) => {
    // const acceptContentType = req.get('Accept', 'text/event-source');

    console.log(`Handling ${req.method} ${req.url}.`);

    res.setHeader('access-control-allow-headers', 'authorization,content-type,x-ms-conversationid');
    res.setHeader('access-control-allow-origin', req.get('origin') || '*');

    return res.send('');
  }
);

app.post(
  [
    '/environments/:environmentId/bots/:botId/test/conversations',
    '/environments/:environmentId/bots/:botId/test/conversations/:conversationId',
    '/environments/:environmentId/bots/:botId/test/conversations/:conversationId/:turn'
  ],
  async (req, res) => {
    // const acceptContentType = req.get('Accept', 'text/event-source');

    const authorization = req.get('authorization');

    if (!authorization) {
      return res.status(401).end();
    }

    const { botId, conversationId, environmentId, turn: initialTurn } = parse(RequestParamsSchema, req.params);
    let turn = initialTurn;

    for (let index = 0; index < 100; index++) {
      const url = new URL(
        `/environments/${encodeURI(environmentId)}/bots/${encodeURI(botId)}/test/conversations${
          conversationId ? `/${conversationId}` : ''
        }${turn ? `/${turn}` : ''}`,
        BASE_URL
      );

      url.search = new URL(req.url, 'http://localhost/').search;

      console.log(`Forwarding to POST ${url}.`);
      console.log(req.body);

      const proxyRes = await fetch(url, {
        body: JSON.stringify(req.body),
        headers: {
          authorization,
          'content-type': req.get('content-type') || 'application/json',
          host: 'https://web.powerva.microsoft.com'
        },
        method: 'POST'
      });

      console.log(`Got ${proxyRes.status}.`);

      res.status(proxyRes.status);

      if (proxyRes.status >= 300) {
        return res.send(await proxyRes.arrayBuffer());
      }

      res.setHeader('access-control-allow-origin', req.get('origin') || '*');
      res.setHeader('content-type', 'text/event-stream');

      const { action, ...json } = parse(ResponseSchema, await proxyRes.json());

      console.log(json);

      res.write(`data: ${JSON.stringify(json)}\n\n`);

      if (action === 'waiting') {
        break;
      }

      turn = 'continue';
    }

    res.write('data: DONE\n\n');

    res.end();
  }
);

server.listen(port, () => console.log(`Proxy listening to port ${port}.`));
