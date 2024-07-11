import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit as RestOctokit } from '@octokit/rest';
import env from '../env.js';

const FullOctokit = RestOctokit.plugin(retry).plugin(throttling);

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
        return options.request.retryCount <= 1;
      },
      onSecondaryRateLimit: (retryAfter, options) => {
        options.request.retryCount <= 1;
      }
    }
  });
}
