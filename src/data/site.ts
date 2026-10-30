/** Site-wide settings. */
export const site = {
  url: 'https://chipatlas.com',
  name: 'Chip Atlas',
  /** Channel links, shown as icons in the header and footer (Social.astro); empty strings are skipped. */
  channels: {
    YouTube: 'https://www.youtube.com/channel/UCBZcrtaL5lu9xB1q2n4qXbA',
    Instagram: 'https://www.instagram.com/chip.atlas/',
    TikTok: '',
  } as Record<string, string>,
};
