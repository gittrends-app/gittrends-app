import {
  Issue,
  PullRequest,
  Reactable,
  Reaction,
  Release,
  RepositoryResource,
  TimelineEvent
} from '../../../entities/Entity.js';
import { Iterable } from '../../service.js';
import { GithubClient } from '../client.js';
import { IterableEndpoints } from '../requests/endpoints.js';
import { iterator } from '../requests/index.js';
import { ResourcesParams } from './index.js';

/**
 *
 */
export default async function <T extends Reactable & RepositoryResource>(
  client: GithubClient,
  entity: T,
  options: ResourcesParams
): Promise<Reaction[]> {
  const reactions: Reaction[] = [];

  if (entity._hasReactions) {
    let reactionsIt: Iterable<Reaction> | undefined;

    switch (true) {
      case entity instanceof Release:
        reactionsIt = iterator(
          {
            client,
            url: 'GET /repositories/:repo/releases/:release/reactions',
            Entity: Reaction,
            metadata: { reactable: entity }
          },
          { ...options, repo: options.repo.id, release: entity.id }
        );
        break;
      case entity instanceof Issue:
      case entity instanceof PullRequest:
        reactionsIt = iterator(
          {
            client,
            url: 'GET /repositories/:repo/issues/:number/reactions',
            Entity: Reaction,
            metadata: { reactable: entity }
          },
          { ...options, repo: options.repo.id, number: entity.number }
        );
        break;
      case entity instanceof TimelineEvent: {
        let url: keyof IterableEndpoints;

        if (entity.event === 'commented') url = 'GET /repositories/:repo/issues/comments/:id/reactions';
        else if (entity.event === 'reviewed') url = 'GET /repositories/:repo/pulls/comments/:id/reactions';
        else throw new Error(`Unhandled timeline event: ${entity.event}`);

        reactionsIt = iterator(
          {
            client,
            url,
            Entity: Reaction,
            metadata: { reactable: entity }
          },
          { ...options, repo: options.repo.id, id: (entity as any).id }
        );
        break;
      }

      default:
        throw new Error(`Unhandled reactable type: ${entity.constructor.name}`);
    }

    for await (const { data } of reactionsIt) {
      reactions.push(...data);
    }
  }

  return reactions;
}
