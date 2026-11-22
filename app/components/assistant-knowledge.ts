export type GuideReply = { text: string; links: { label: string; href: string }[] };
export function guideReply(input: string): GuideReply {
  const q = input.toLowerCase();
  if (/price|cost|quote|fee|價格|費用|報價|多少錢|\d+\s*panels/.test(q)) return {
    text: 'Processing costs depend on wattage, quantity and condition. Truck-scale shipments are per panel; trailers settle by scale weight including pallets and packaging. Transport is separate. The estimator loads the active wattage pricing rules. Condition surcharges can be combined and are added rather than multiplied. Use the estimator for current rates; this guide does not cache or independently quote prices. Drop-off fees remain to be confirmed. Generate your dated processing quotation in the quotation tool; delivery arrangements are separate.',
    links: [{ label: 'Estimate recycling costs', href: '/recycling-estimate' }, { label: 'Explore recycling services', href: '/services' }],
  };
  if (/prepare|label|model|準備|型號/.test(q)) return { text: 'Have the panel count, manufacturer/model or rated watts, condition and US location ready. The label is usually on the back of the module. Do not handle damaged panels just to find a label; use existing records or ask for assistance. Photo upload currently previews the image only; AI recognition is not connected.', links: [{label:'Start an estimate',href:'/recycling-estimate'}] };
  if (/pickup|delivery|收運|運輸|自送/.test(q)) return { text: 'You can explore self-arranged delivery or request pickup pricing. Transport is quoted separately; availability, acceptance and dates need confirmation. Arrange a receiving appointment and agree packaging requirements before shipping.', links: [{label:'Delivery and service details',href:'/services'}] };
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
    links: [{ label: 'Get a recycling estimate', href: '/recycling-estimate' }, { label: 'Recycling FAQ', href: '/services#faq' }],
  };
  return {
    text: 'This is a website knowledge guide demo; OpenAI is not connected. I can help you find recycling estimates, PV Circulator information, the business case calculator or circular materials. Are you recycling panels, evaluating equipment or sourcing materials?',
    links: [{ label: 'Estimate recycling costs', href: '/recycling-estimate' }, { label: 'Evaluate recycling equipment', href: '/solutions' }, { label: 'Source circular materials', href: '/circular-products' }],
  };
}
