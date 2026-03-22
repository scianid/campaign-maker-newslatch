export function parseAdBridgeUrls(text) {
  const seen = new Set();
  const valid = [];
  const invalid = [];

  for (const raw of text.split(/[\n,]+/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    try {
      const url = new URL(trimmed);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }

      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        valid.push(trimmed);
      }
    } catch {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

export function deriveCompanyName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const base = hostname.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Unknown';
  }
}

export function extractCompanyName(result, url) {
  return result.companyName || deriveCompanyName(url);
}

export function formatBridgeType(type) {
  if (!type) return '';

  return type
    .split('_')
    .map(word => {
      if (word === 'TIER') return 'Tier';
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function combinedScore(campaign) {
  return ((campaign.urgencyScore ?? 0) + (campaign.qualityScore ?? 0)) / 2;
}

export function buildFbCopy(campaign) {
  return [campaign.adHeader, '', campaign.adBody, '', campaign.callToAction]
    .filter(value => value != null)
    .join('\n');
}

export function normalizeSavedResult(result) {
  return {
    campaignId: result.campaign_id,
    status: result.status,
    adHeader: result.ad_header,
    adBody: result.ad_body,
    clickBait: result.click_bait,
    callToAction: result.call_to_action,
    adImagePrompt: result.ad_image_prompt,
    urgencyScore: result.urgency_score,
    qualityScore: result.quality_score,
    bridgeType: result.bridge_type,
    sourcesLinks: result.sources_links,
    bridgeFoundation: result.bridge_foundation,
  };
}

export function exportAdBridgeCsv(results, analyzedMap) {
  const headers = [
    'Company',
    'Source URL',
    'Ad Headline',
    'Ad Body',
    'Hook',
    'Call to Action',
    'Image Prompt',
    'Urgency Score',
    'Quality Score',
    'Bridge Type',
    'Status',
  ];

  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const rows = results.map(result => {
    const info = analyzedMap[result.campaignId] || {};
    return [
      escape(info.companyName),
      escape(info.url),
      escape(result.adHeader),
      escape(result.adBody),
      escape(result.clickBait),
      escape(result.callToAction),
      escape(result.adImagePrompt),
      escape(result.urgencyScore),
      escape(result.qualityScore),
      escape(result.bridgeType),
      escape(result.status),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `adbridge-${Date.now()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
