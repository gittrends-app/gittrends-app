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
  private readonly disableRetry: boolean = false;
  private readonly disableThrottling: boolean = false;

  private readonly fetcher: any;

  constructor(
    baseUrl: string,
    opts?: { apiToken?: string; disableRetry?: boolean; disableThrottling?: boolean; fetcher?: any }
  ) {
    this.baseUrl = baseUrl;
    this.apiToken = opts?.apiToken;
    this.disableRetry = opts?.disableRetry ?? false;
    this.disableThrottling = opts?.disableThrottling ?? false;
    this.fetcher = opts?.fetcher;
  }

  get rest(): Octokit {
    return new FullOctokit({
      request: { fetch: this.fetcher },
      baseUrl: this.baseUrl,
      auth: this.apiToken,
      mediaType: { previews: ['starfox'] },
      retry: { enabled: !this.disableRetry },
      throttle: {
        enabled: !this.disableThrottling,
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
      request: { fetch: this.fetcher },
      baseUrl: this.baseUrl,
      headers: {
        authorization: `token ${this.apiToken}`
      }
    });
  }
}
