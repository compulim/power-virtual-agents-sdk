/* eslint-env node */

const { 'pva:extends': rootConfigPath, ...perProjectConfig } = require('./jest.config.json');

// Please do not modify this file, instead, modify ./jest.config.json.
// Jest does not support inheriting configurations, this is for adding inheritance only.
// Do not add dynamic configuration and keep Jest configuration as simple as possible.

const config = { ...(rootConfigPath ? require(rootConfigPath) : {}), ...perProjectConfig };

module.exports = config;
