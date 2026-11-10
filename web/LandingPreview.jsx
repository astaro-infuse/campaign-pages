import { useEffect, useState } from 'react';

// Preview of the public landing page inside the admin app
export default function LandingPreview({ campaignId }) {
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`, {
      headers: { 'x-user-id': localStorage.getItem('userId') },
    })
      .then((res) => res.json())
      .then(setCampaign);
  }, []);

  if (!campaign) return <p>Loading...</p>;

  return (
    <div className="preview">
      <div className="logo" dangerouslySetInnerHTML={{ __html: campaign.logoSvg }} />
      <h1>{campaign.title}</h1>
      <a href={`/l/${campaign.slug}`} target="_blank">
        Open public page
      </a>
    </div>
  );
}
