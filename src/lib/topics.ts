import topicsRaw from '../../prompts/topics.json';
import type { Topic, TopicId } from '@/types';

export const TOPICS = topicsRaw as Topic[];

export function getTopic(id: TopicId | null | undefined): Topic | undefined {
  if (!id) return undefined;
  return TOPICS.find((t) => t.id === id);
}
