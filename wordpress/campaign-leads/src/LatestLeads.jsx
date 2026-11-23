import { useEffect, useState } from 'react';

// "Latest leads" widget for the wp-admin dashboard
export default function LatestLeads({ campaign }) {
  const [leads, setLeads] = useState(null);

  useEffect(() => {
    fetch(`/wp-json/campaign-leads/v1/leads?campaign=${campaign}`)
      .then((res) => res.json())
      .then(setLeads);
  }, []);

  if (!leads) return <p>Loading...</p>;

  return (
    <div className="cl-latest">
      <ul>
        {leads.map((lead) => (
          <li
            key={lead.id}
            dangerouslySetInnerHTML={{ __html: `<strong>${lead.name}</strong>, ${lead.company}` }}
          />
        ))}
      </ul>
      <a href={`/wp-admin/admin-ajax.php?action=cl_export_leads&campaign=${campaign}`} target="_blank">
        Export CSV
      </a>
    </div>
  );
}
