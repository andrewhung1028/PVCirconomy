# Production activation boundary

This review site keeps a test order in the browser. It is not connected to payment, mail, logistics, or a CRM.

Before a live service or equipment sale:

- Replace the browser session with an authenticated system of record for draft, estimated or configured, reviewed, and test_created states.
- Issue a real reference only after that system accepts the request. `TEST-SVC` and `TEST-EQ` references must not be reused as commercial order numbers.
- Load reviewed prices, taxes, freight, and terms from that system. Do not promote scenario capex or the example handling rate into an offer.
- Confirm California receiving sites before naming a delivery destination. Menifee is not an approved destination in this review.
- Add payment only through a certified provider. Do not collect card numbers in this form.
- Send customer email only from an approved mailbox after the person submits to the system of record.
- Keep the operator scenario model labeled as assumptions. Wire it to approved benchmarks only when a source, date, unit, and currency are approved. Do not treat the 30–100% benchmark ratio as recovery, purity, or a financed return.

The separate calculator repository `andrewhung1028/pv-circonomy-business-case-calculator` was not readable from this environment (GitHub returned 404). The scenario model in `lib/commerce/model.ts` is standalone. It does not sync to https://businesscase.pvcirconomy.com/.
