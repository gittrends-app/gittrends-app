import { graphql } from '@octokit/graphql';
import { Fetch } from '@octokit/types';

/**
 * GithubClient is a wrapper around Octokit that provides a consistent interface for interacting with the Github API.
 */
export class GithubClient {
  private readonly baseUrl: string;
  private readonly apiToken?: string;
  private readonly fetcher?: Fetch;

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
    this.fetcher = opts?.fetcher;
  }

  get graphql(): typeof graphql {
    return graphql.defaults({
      request: { fetch: this.fetcher },
      baseUrl: this.baseUrl,
      mediaType: { previews: ['starfox'] },
      headers: {
        authorization: `token ${this.apiToken}`
      }
    });
  }
}
