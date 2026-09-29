const topicSeparator = /[\n,]/;

export function topicsFrom(value: string): string[] {
  const topics = value
    .split(topicSeparator)
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);

  return [...new Set(topics)];
}

export function topicsTo(topics: string[]): string {
  return topics.join("\n");
}
