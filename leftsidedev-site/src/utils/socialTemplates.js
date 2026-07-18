/**
 * Reusable social publishing templates generated from blog posts.
 */

export function linkedInPost(post, siteUrl) {
  const url = `${siteUrl}/blog/${post.slug}`;
  return [
    `${post.title}`,
    '',
    post.excerpt,
    '',
    `Key takeaways from our ${post.category} notes:`,
    ...post.body.slice(0, 3).map((line) => `• ${line}`),
    '',
    `Read the full article: ${url}`,
    '',
    `#${post.category.replace(/\s+/g, '')} #AIEngineering #LeftSideDev`,
  ].join('\n');
}

export function xThread(post, siteUrl) {
  const url = `${siteUrl}/blog/${post.slug}`;
  const tweets = [
    `${post.title}\n\nA short thread from LeftSideDev (${post.readingMinutes} min read):`,
    ...post.body.slice(0, 4).map((line, index) => `${index + 2}/ ${line}`),
    `${Math.min(post.body.length, 4) + 2}/ Full article → ${url}`,
  ];
  return tweets;
}

export function shortVideoScript(post) {
  return [
    `HOOK (0–3s): ${post.title}?`,
    `PROBLEM (3–8s): ${post.excerpt}`,
    `INSIGHT (8–20s): ${post.body[0] || ''}`,
    `PROOF (20–35s): ${post.body[1] || post.body[0] || ''}`,
    `CTA (35–45s): Follow LeftSideDev for AI engineering breakdowns. Link in bio for the full guide.`,
  ].join('\n');
}

export function youtubeDescription(post, siteUrl) {
  const url = `${siteUrl}/blog/${post.slug}`;
  return [
    post.excerpt,
    '',
    'Chapters',
    '00:00 Intro',
    '00:20 Problem',
    '01:00 Practical approach',
    '02:30 Takeaways',
    '',
    `Article: ${url}`,
    '',
    `Tags: ${post.tags.join(', ')}`,
    '',
    'LeftSideDev — AI Engineering Studio',
  ].join('\n');
}

export function facebookPost(post, siteUrl) {
  return `${post.title}\n\n${post.excerpt}\n\nRead more: ${siteUrl}/blog/${post.slug}`;
}

export function instagramCaption(post) {
  return [
    post.title,
    '',
    post.excerpt,
    '',
    'Save this for your next build review.',
    '',
    `#LeftSideDev #AIEngineering #${post.category.replace(/\s+/g, '')}`,
  ].join('\n');
}

export function buildSocialPack(post, siteUrl) {
  return {
    linkedin: linkedInPost(post, siteUrl),
    xThread: xThread(post, siteUrl),
    reelScript: shortVideoScript(post),
    youtube: youtubeDescription(post, siteUrl),
    facebook: facebookPost(post, siteUrl),
    instagram: instagramCaption(post),
  };
}
