import { Issue, Reaction, Release, Stargazer, Tag, TimelineEvent, Watcher } from '@/core/index.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';

export const up = async (db: Db) => {
  await Promise.all(
    [Tag, Release, Stargazer, Watcher, Issue, Reaction, TimelineEvent].map((Ref) =>
      db
        .collection(pluralize(Ref.prototype._entityname))
        .createIndexes([{ key: { _repository: 1 }, name: 'repository_idx' }])
    )
  );
};

export const down = async (db: Db) => {
  await Promise.all(
    [Tag, Release, Stargazer, Watcher, Issue, Reaction, TimelineEvent].map((Ref) =>
      db.collection(pluralize(Ref.prototype._entityname)).dropIndex('repository_idx')
    )
  );
};
