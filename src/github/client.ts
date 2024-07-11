import { graphql as graphqlClient } from '@octokit/graphql';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';
import consola from 'consola';
import env from '../env.js';

const FullOctokit = Octokit.plugin(throttling).plugin(retry);

// The restClient is an instance of the Octokit class with the throttling and retry plugins enabled.
export const rest: Octokit = new FullOctokit({
  baseUrl: env.GITHUB_API_BASE_URL,
  auth: env.GITHUB_API_TOKEN,
  retry: { enabled: true },
  throttle: {
    enabled: true,
    onRateLimit: (retryAfter, options) => {
      return options.request.retryCount < 3;
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      return options.request.retryCount < 3;
    }
  },
  log: { debug: consola.debug, info: consola.debug, warn: consola.warn, error: consola.error }
});

// The graphqlClient is an instance of the graphql function with the default options.
export const graphql = graphqlClient.defaults({
  baseUrl: env.GITHUB_API_BASE_URL,
  headers: {
    authorization: `token ${env.GITHUB_API_TOKEN}`
  }
});
