import { graphql as graphqlClient } from '@octokit/graphql';
import { graphql } from '@octokit/graphql/types';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';
import { Fetch } from '@octokit/types';
import consola from 'consola';

const FullOctokit = Octokit.plugin(throttling).plugin(retry);

/**
 * GithubClient is a wrapper around Octokit that provides a consistent interface for interacting with the Github API.
 */
export class GithubClient {
  private readonly baseUrl: string;

  private readonly apiToken?: string;
  private readonly disableRetry: boolean = false;
  private readonly disableThrottling: boolean = false;

  private readonly fetcher?: Fetch;
  private readonly timeout?: number;

  constructor(
    baseUrl: string,
    opts?: {
      apiToken?: string;
      disableRetry?: boolean;
      disableThrottling?: boolean;
      fetcher?: Fetch;
      timeout?: number;
    }
  ) {
    this.baseUrl = baseUrl;
    this.apiToken = opts?.apiToken;
    this.disableRetry = opts?.disableRetry ?? false;
    this.disableThrottling = opts?.disableThrottling ?? false;
    this.fetcher = opts?.fetcher;
    this.timeout = opts?.timeout;
  }

  get rest(): Octokit {
    return new FullOctokit({
      request: { fetch: this.fetcher, timeout: this.timeout },
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
      log: { debug: () => void 0, info: () => void 0, warn: consola.warn, error: consola.debug }
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
