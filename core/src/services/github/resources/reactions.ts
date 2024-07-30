import cloneDeep from 'lodash/cloneDeep.js';
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
async function _reactions<T extends Reactable & RepositoryResource>(
  client: GithubClient,
  entity: T,
  options: ResourcesParams
): Promise<Reaction[]> {
  const reactions: Reaction[] = [];

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

      if (entity.event === 'line-commented') {
        const commentsReactions = await Promise.all(
          (entity.comments as any[])
            .map((comment) =>
              Object.assign(
                new TimelineEvent(
                  { ...cloneDeep(comment), event: 'commented' },
                  { repository: entity._repository, issue: entity._issue }
                ),
                { pull_request: true }
              )
            )
            .map((comment) => _reactions(client, comment, options))
        );

        return commentsReactions.flat();
      }

      if (entity.event === 'commented') {
        if (entity.pull_request) url = 'GET /repositories/:repo/pulls/comments/:id/reactions';
        else url = 'GET /repositories/:repo/issues/comments/:id/reactions';
      } else if (entity.event === 'reviewed') url = 'GET /repositories/:repo/pulls/comments/:id/reactions';
      else if (entity._hasReactions) throw new Error(`Unhandled timeline event: ${entity.event}`);
      else return reactions;

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

  if (entity._hasReactions) {
    for await (const { data } of reactionsIt) {
      reactions.push(...data);
    }
  }

  return reactions;
}

export default _reactions;
