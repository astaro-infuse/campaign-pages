const VIDEO_API_URL = process.env.VIDEO_API_URL ?? 'https://api.example-video.com/v1/videos';
const VIDEO_API_KEY = 'vk_live_8f2c1e9a7b6d4c3e2f1a0b9c8d7e6f5a';

export async function generateVideo(campaign) {
  const res = await fetch(VIDEO_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${VIDEO_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      campaignId: campaign.id,
      script: `Hi! Welcome to ${campaign.title}.`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Video API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
