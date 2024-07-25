import { graphql as graphqlClient } from '@octokit/graphql';
import { graphql } from '@octokit/graphql/types';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';
import consola from 'consola';

const FullOctokit = Octokit.plugin(throttling).plugin(retry);

/**
 * Github client
 */
export class GithubClient {
  private readonly baseUrl: string;

  private readonly apiToken?: string;
  private readonly enableRetry: boolean = true;
  private readonly enableThrottling: boolean = true;

  constructor(baseUrl: string, opts?: { apiToken?: string; enableRetry?: boolean; enableThrottling?: boolean }) {
    this.baseUrl = baseUrl;
    this.apiToken = opts?.apiToken;
    this.enableRetry = opts?.enableRetry ?? true;
    this.enableThrottling = opts?.enableThrottling ?? true;
  }

  get rest(): Octokit {
    return new FullOctokit({
      baseUrl: this.baseUrl,
      auth: this.apiToken,
      mediaType: { previews: ['starfox'] },
      retry: { enabled: this.enableRetry },
      throttle: {
        enabled: this.enableThrottling,
        onRateLimit: (retryAfter, options) => {
          return options.request.retryCount < 3;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          return options.request.retryCount < 3;
        }
      },
      log: { debug: () => void 0, info: () => void 0, warn: consola.warn, error: consola.error }
    });
  }

  get graphql(): graphql {
    return graphqlClient.defaults({
      baseUrl: this.baseUrl,
      headers: {
        authorization: `token ${this.apiToken}`
      }
    });
  }
}
