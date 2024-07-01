// TODO: We use `waitUntil` and it requires DOM.
//       We should find `waitUntil`-alt that doesn't need DOM so we don't need to load JSDOM.

/* eslint-disable no-undef */
const JSDOMEnvironment = require('jest-environment-jsdom').default;

class JestEnvironmentWithJSDOMAndWritableStream extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);

    this.global.WritableStream = WritableStream;
  }
}

module.exports = JestEnvironmentWithJSDOMAndWritableStream;
