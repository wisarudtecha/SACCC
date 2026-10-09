export interface MentionUser {
  /** Persisted user id — sent as `mentionedUserIds` when the comment is submitted. */
  id?: string | number;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photo?: string;
}
