import { type Activity as DirectLineJSActivity } from 'botframework-directlinejs';
import type { Attachment } from './Attachment';

export type Activity = DirectLineJSActivity & {
  attachments?: Attachment[] | undefined;
};
