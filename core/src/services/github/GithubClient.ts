import { graphql } from '@octokit/graphql';
import { Fetch } from '@octokit/types';
import throttler from '../../helpers/throttler.js';

/**
 * GithubClient is a wrapper around the Github API client.
 */
export class GithubClient {
  private readonly baseUrl: string;
  private readonly apiToken?: string;
  private readonly fetcher?: Fetch;

  constructor(
    baseUrl: string = 'https://api.github.com',
    opts?: { apiToken?: string; fetcher?: Fetch; timeout?: number }
  ) {
    this.baseUrl = baseUrl;
    this.apiToken = opts?.apiToken;

    this.fetcher = opts?.fetcher || fetch;
    if (baseUrl === 'https://api.github.com') this.fetcher = throttler(this.fetcher, 2);
  }

  get graphql(): typeof graphql {
    return graphql.defaults({
      request: { fetch: this.fetcher },
      baseUrl: this.baseUrl,
      mediaType: { previews: ['starfox'] },
      headers: { authorization: `token ${this.apiToken}` }
    });
  }
}
