# Recycling estimate assumptions

All rates and capacities below are illustrative, approved for a prototype, and configured in `lib/recycling-estimate.ts`.

- Reference silicon model: 50 lb per panel; not a real manufacturer/model lookup.
- Drop-off: 100 panels by default; USD 8/panel from 100 panels, otherwise USD 10/panel.
- Pickup: 720 panels / 24 pallets as a planning assumption; USD 6/panel for the reference full load plus USD 250 transport. This is not a certified trailer capacity.
- Reference pickup location: Menifee, CA 92584. It is a disclosed assumption, not geolocation or IP detection. Other pickup cities or ZIPs require a transport quote. The first screen collects only the city; booking collects the actual ZIP and street address.
- Non-CA origins require manual transport review. Project Support feasibility assessment requires capacity strictly above 1 MW, including California and other locations; it is not automatic acceptance.
- Unknown models, non-intact panels and loads above the reference pickup capacity require review.
- Continue to booking carries method, quantity, reference model and pickup city and receiving-site ID via URL parameters. Personal data is not put in the URL.
- Booking collects model details, condition, origin address, date, pickup packaging/loading details and contact data. It remains local validation only; no order is sent or reserved.

Replace these settings and connect transport/service pricing before commercial launch. The estimate engine is shared by Services and booking to prevent inconsistent totals.

Drop-off receiving sites are configured in `lib/recycling-locations.ts`, currently Menifee, CA 92584. Add only confirmed sites; California pickup city suggestions are not receiving sites.
