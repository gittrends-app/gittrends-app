import { graphql } from '@octokit/graphql';
import { graphql as GraphQL } from '@octokit/graphql/types';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit as RestOctokit } from '@octokit/rest';
import consola from 'consola';
import env from '../env.js';

const FullOctokit = RestOctokit.plugin(throttling).plugin(retry);

/**
 * Create a new GitHub REST API client.
 *
 * @returns {RestOctokit}
 */
export function createRestClient(): RestOctokit {
  return new FullOctokit({
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
}

/**
 *
 * @returns
 */
export function createGraphqlClient(): GraphQL {
  return graphql.defaults({
    baseUrl: env.GITHUB_API_BASE_URL,
    headers: {
      authorization: `token ${env.GITHUB_API_TOKEN}`
    }
  });
}
