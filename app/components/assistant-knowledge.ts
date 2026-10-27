export type GuideReply = { text: string; links: { label: string; href: string }[] };
export function guideReply(input: string): GuideReply {
  const q = input.toLowerCase();
  if (/price|cost|quote|fee|\d+\s*panels/.test(q)) return {
    text: 'Recycling costs depend on panel quantity, model, condition and logistics. Demo rates are USD 10 per panel below 100 panels, USD 8 from 100 panels, and USD 6 for the reference 720-panel pickup load, plus USD 250 reference local transport. The pickup location is an assumption, not a detected location. These are not commercial quotes. Transport outside California is handled by Project Support.',
    links: [{ label: 'Estimate recycling costs', href: '/shop?type=recycling' }, { label: 'Explore recycling services', href: '/services' }],
  };
  if (/material|glass|aluminum|copper|silicon/.test(q)) return {
    text: 'Circular Products presents recovered glass, aluminum, copper and cell materials. Availability, composition, purity and delivery terms require batch-specific confirmation. Include your application, specifications, volume and delivery location in a materials inquiry.',
    links: [{ label: 'Explore circular products', href: '/circular-products' }, { label: 'Request a material quote', href: '/shop?type=materials' }],
  };
  if (/circulator|equipment|invest|calculator|business|payback/.test(q)) return {
    text: 'Explore the PV Circulator video and brochure, then use the Business Case Calculator to adjust volume, processing fees and operating assumptions. Results are indicative scenarios, not guaranteed investment returns.',
    links: [{ label: 'Explore PV Circulator', href: '/solutions#circulator' }, { label: 'Open the business case calculator', href: '/business-case' }, { label: 'Equipment inquiry', href: '/shop?type=equipment' }],
  };
  if (/epr|compliance|report|regulation|environment/.test(q)) return {
    text: 'Recycling and EPR-related documentation depends on your market, service scope and project conditions. This preview does not provide legal determinations or verified environmental performance data. Define your recycling, traceability and reporting requirements before booking.',
    links: [{ label: 'Explore the complete approach', href: '/solutions' }, { label: 'View service information', href: '/services' }],
  };
  if (/recycl|book|collect|panel|damaged|transport/.test(q)) return {
    text: 'Start with your panel quantity, technology, condition, location and preferred date. Explore self-delivery or collection. This version previews the booking flow but does not submit an order or reserve a time slot.',
    links: [{ label: 'Estimate & book recycling', href: '/shop?type=recycling' }, { label: 'Recycling FAQ', href: '/services#faq' }],
  };
  return {
    text: 'This is a website knowledge guide demo; OpenAI is not connected. I can help you find recycling estimates, PV Circulator information, the business case calculator or circular materials. Are you recycling panels, evaluating equipment or sourcing materials?',
    links: [{ label: 'Estimate recycling costs', href: '/shop?type=recycling' }, { label: 'Evaluate recycling equipment', href: '/solutions' }, { label: 'Source circular materials', href: '/circular-products' }],
  };
}
