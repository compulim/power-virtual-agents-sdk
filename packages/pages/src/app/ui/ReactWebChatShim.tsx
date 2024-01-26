import type ReactWebChat from 'botframework-webchat';
import React, { useEffect, useState, type ComponentType } from 'react';

type PropsOf<T> = T extends ComponentType<infer P> ? P : never;
type Props = PropsOf<typeof ReactWebChat>;

let loadWebChatJSPromise: Promise<void> | undefined;

async function loadWebChatJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptElement = document.createElement('script');

    scriptElement.setAttribute('async', 'async');
    scriptElement.setAttribute('src', 'asset/js/webchat-es5.js');

    scriptElement.addEventListener('load', () => resolve(), { once: true });
    scriptElement.addEventListener('error', reject, { once: true });

    window.React = React;

    document.body.appendChild(scriptElement);
  });
}

const ReactWebChatShim = (props: Props) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    (async function () {
      await (loadWebChatJSPromise || (loadWebChatJSPromise = loadWebChatJS()));

      abortController.signal.aborted || setLoaded(true);
    })();

    return () => abortController.abort();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ReactWebChat = loaded && (window as any)['WebChat'].ReactWebChat;

  return ReactWebChat && <ReactWebChat {...props} />;
};

export default ReactWebChatShim;
