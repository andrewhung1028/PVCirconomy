"use client";
import {
  defaultPickupDetails,
  capacityFits,
  requiredVehicles,
  pickupCharges,
  validPickup,
} from "../../lib/pickup";
import { cargoTotals } from "../../lib/pickup-cargo";
import { validOrigin } from "../../lib/delivery";
import {
  PickupFields,
  FreightDetails,
  type FreightBreakdown,
} from "./pickup-fields";
import {
  ReceivingCalendar,
  type CalendarAvailability,
} from "./receiving-calendar";
import { useEffect, useRef, useState } from "react";
import type { QuotationBundle } from "../../lib/quotation-types";
import { money } from "../../lib/batch-quote";
import type {
  Booking,
  DeliveryMethod,
  DeliverySnapshot,
  OriginAddress,
} from "../../lib/delivery";
export function DeliveryPlanner({
  quotation,
  onBookingOpenChange,
  onProgressChange,
}: {
  quotation: QuotationBundle | null;
  onBookingOpenChange?: (open: boolean) => void;
  onProgressChange?: (step: number) => void;
}) {
  const [pickup, setPickup] = useState({ ...defaultPickupDetails });
  const [config, setConfig] = useState<
    (DeliverySnapshot & { mapsConfigured: boolean }) | null
  >(null);
  const [availability, setAvailability] = useState<CalendarAvailability | null>(
    null,
  );
  const [method, setMethod] = useState<DeliveryMethod>("self");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [origin, setOrigin] = useState<OriginAddress>({
    street: "",
    city: "",
    state: "CA",
    zip: "",
  });
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [freight, setFreight] = useState<{
    id: string;
    amount: number;
    distanceMiles: number;
    expiresAt: string;
    breakdown?: FreightBreakdown;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; status: string } | null>(
    null,
  );
  const key = useRef("");
  const freightSerial = useRef(0);
  const calendarSerial = useRef(0);
  useEffect(() => {
    onProgressChange?.(!quotation ? 0 : receipt ? 3 : bookingOpen ? 2 : 1);
  }, [quotation?.recordId, receipt, bookingOpen, onProgressChange]);
  useEffect(() => {
    if (quotation?.contact) setContact((c) => ({ ...c, ...quotation.contact }));
    else
      fetch("/api/auth/session/", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.user)
            setContact((c) => ({
              ...c,
              name: c.name || d.user.name || "",
              email: c.email || d.user.email || "",
            }));
        })
        .catch(() => {});
  }, [quotation?.recordId]);
  useEffect(() => {
    onBookingOpenChange?.(bookingOpen && !receipt && !!quotation);
  }, [bookingOpen, receipt, quotation?.recordId, onBookingOpenChange]);
  function toggleBooking(open: boolean) {
    setBookingOpen(open);
    requestAnimationFrame(() =>
      document
        .getElementById("delivery")
        ?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        }),
    );
  }
  async function calendar() {
    const serial = ++calendarSerial.current;
    try {
      const r = await fetch(
        "/api/delivery/availability/?method=" + method,
        { cache: "no-store" },
      );
      if (!r.ok) throw Error();
      const value = await r.json();
      if (serial !== calendarSerial.current) return;
      setAvailability(value);
      setBookings((previous) =>
        previous.length
          ? previous
          : [
              {
                date: value.days[0]?.date || "",
                period: "am",
                vehicle: "truck",
                count: 1,
              },
            ],
      );
    } catch {
      if (serial === calendarSerial.current)
        setStatus("Scheduling calendar is unavailable. Please retry.");
    }
  }
  useEffect(() => {
    let current = true;
    void fetch("/api/delivery/settings/", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (current) setConfig(d);
      })
      .catch(() => {
        if (current)
          setStatus("Delivery settings are unavailable. Please retry.");
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    setBusy(false);
    setPickup({ ...defaultPickupDetails });
    setReceipt(null);
    setBookingOpen(false);
    setActiveBatch(0);
    setFreight(null);
    setBookings([]);
    setAccepted(false);
    key.current = crypto.randomUUID();
    setStatus("");
    freightSerial.current++;
    calendarSerial.current++;
  }, [quotation?.recordId]);
  useEffect(() => {
    if (!quotation) return;
    let current = true;
    fetch("/api/recycling-orders/status/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quotationId: quotation.recordId,
        accessToken: quotation.accessToken,
      }),
    })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (current && d?.order) setReceipt(d.order);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [quotation?.recordId]);
  useEffect(() => {
    if (bookingOpen) {
      void calendar();
    }
  }, [bookingOpen, method]);
  function invalidate() {
    setBusy(false);
    setFreight(null);
    freightSerial.current++;
    setStatus("");
    key.current = crypto.randomUUID();
  }
  function booking(index: number, change: Partial<Booking>) {
    invalidate();
    setBookings((previous) =>
      previous.map((b, i) => (i === index ? { ...b, ...change } : b)),
    );
  }
  function remainingFor(
    index: number,
    period: "am" | "pm",
    date = bookings[index]?.date,
  ) {
    if (!config || !availability) return 0;
    const b = bookings[index];
    const slot = availability.days
      .find((d) => d.date === date)
      ?.periods.find((p) => p.period === period);
    if (!slot) return 0;
    const other = bookings.reduce(
      (n, row, i) =>
        i !== index && row.date === date && row.period === period
          ? n +
            row.count *
              (row.vehicle === "truck"
                ? config.settings.trailerCapacity
                : config.settings.truckCapacity)
          : n,
      0,
    );
    return Math.max(
      0,
      Math.floor(
        (slot.availableUnits - other) /
          (b.vehicle === "truck"
            ? config.settings.trailerCapacity
            : config.settings.truckCapacity),
      ),
    );
  }
  const cargo = quotation
    ? cargoTotals(
        quotation.lines,
        quotation.pricing.rules,
        pickup,
        config?.settings.transport,
      )
    : null;
  const loadFits =
    !!cargo &&
    !!config &&
    capacityFits(cargo, bookings, config.settings.transport);
  const needed =
    !!cargo && !!config && bookings.length
      ? requiredVehicles(cargo, bookings[0].vehicle, config.settings.transport)
      : null;
  const slotsValid =
    (method !== "pickup" || loadFits) &&
    bookings.length > 0 &&
    bookings.every((b, i) => remainingFor(i, b.period) >= b.count);
  const selectedRates =
    !!config &&
    bookings.every((b) =>
      Object.values(config.settings.rates[b.vehicle]).every((v) => v !== null),
    );
  const freightReady = !!config?.mapsConfigured && selectedRates;
  async function getFreight() {
    if (!quotation) return;
    const serial = ++freightSerial.current;
    setBusy(true);
    setStatus("Calculating road distance and pickup pricing…");
    try {
      const r = await fetch("/api/delivery/freight/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: quotation.recordId,
          accessToken: quotation.accessToken,
          origin,
          bookings,
          pickup,
        }),
      });
      const data = await r.json();
      if (serial !== freightSerial.current) return;
      if (!r.ok) {
        setStatus(
          data.error === "us_address_required"
            ? "Enter a valid US pickup address."
            : data.error === "load_exceeds_bookings"
              ? "Add vehicles or delivery batches to meet the shipment loading limits."
              : "Pickup pricing is unavailable. Check your address or retry.",
        );
        return;
      }
      setFreight(data);
      setStatus("Pickup pricing calculated.");
    } catch {
      if (serial === freightSerial.current)
        setStatus("Pickup pricing is unavailable. Please retry.");
    } finally {
      if (serial === freightSerial.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (
      !bookingOpen ||
      method !== "pickup" ||
      !freightReady ||
      !slotsValid ||
      !validOrigin(origin) ||
      !validPickup(pickup)
    )
      return;
    const timer = setTimeout(() => {
      void getFreight();
    }, 900);
    return () => clearTimeout(timer);
  }, [
    bookingOpen,
    method,
    freightReady,
    slotsValid,
    JSON.stringify(origin),
    JSON.stringify(bookings),
    JSON.stringify(pickup),
    quotation?.recordId,
    config?.version,
  ]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!quotation) return;
    setBusy(true);
    setStatus("Submitting your recycling order request…");
    try {
      const r = await fetch("/api/recycling-orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: quotation.recordId,
          accessToken: quotation.accessToken,
          idempotencyKey: key.current,
          method,
          bookings,
          origin: method === "pickup" ? origin : null,
          contact,
          acceptedTerms: accepted,
          freightQuoteId: freight?.id ?? null,
          ...(method === "pickup" ? { pickup } : {}),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.error === "quote_already_has_order") {
          setStatus(
            "This quotation already has order request " +
              data.id +
              ". Contact the company to change it, or generate a new quotation.",
          );
        } else if (data.error === "slot_or_settings_changed") {
          setStatus(
            "That time window is no longer available or settings have changed. Please choose again.",
          );
          await calendar();
        } else if (
          data.error === "freight_quote_changed_or_expired" ||
          data.error === "freight_quote_required"
        ) {
          setFreight(null);
          setStatus("Recalculate pickup pricing before submitting.");
        } else if (data.error === "load_exceeds_bookings")
          setStatus(
            "Add vehicles or delivery batches to meet the shipment loading requirements.",
          );
        else if (data.error === "quotation_expired_or_invalid")
          setStatus(
            "Your quotation has expired. Return to pricing to generate a new one.",
          );
        else
          setStatus(
            "Check the contact information, dates and address, then retry. No request has been confirmed.",
          );
        return;
      }
      setReceipt(data);
      setStatus("");
      requestAnimationFrame(() =>
        document
          .getElementById("delivery")
          ?.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          }),
      );
    } catch {
      setStatus(
        "Submission could not be verified. Retry safely using the same request.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function emailQuotation() {
    if (!quotation) return;
    const email =
      quotation.contact?.email ||
      quotation.document.text.match(/^Email: (.+)$/m)?.[1];
    if (!email) {
      setStatus(
        "Return to pricing to generate a quotation with your name and email.",
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/quotations/email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: quotation.recordId,
          accessToken: quotation.accessToken,
          email,
          freightQuoteId: freight?.id,
          orderId: receipt?.id,
        }),
      });
      const data = await response.json();
      setStatus(
        response.ok
          ? "Quotation sent to " + email + "."
          : data.error === "send_in_progress"
            ? "Your email is being processed. Check your inbox before retrying."
            : "Email delivery could not be confirmed. Check your inbox before retrying.",
      );
    } catch {
      setStatus(
        "Email delivery could not be confirmed. Please check your inbox.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!quotation)
    return (
      <div className="pv-delivery-planner">
        <p>
          Start with your panel details to generate a quotation, then plan
          delivery here.
        </p>
        <a className="pv-text-button" href="#pricing">
          Get your recycling quotation
        </a>
      </div>
    );
  return (
    <div className="pv-delivery-planner">
      <div
        className={
          "pv-booking-layout" + (bookingOpen && !receipt ? " is-open" : "")
        }
      >
        <div className="pv-booking-left">
          <div className="pv-delivery-quote">
            <p>Quotation {quotation.document.id}</p>
            <strong>
              {quotation.processingTotal === null
                ? "Processing charges require review"
                : money(quotation.processingTotal)}
            </strong>
            <p className="pv-note">
              Valid until {new Date(quotation.expiresAt).toLocaleString()} · USD
              processing charges
            </p>
            <button
              className="pv-text-button"
              disabled={busy}
              onClick={emailQuotation}
            >
              Email quotation
            </button>
          </div>
          {receipt ? (
            <div role="status">
              <h3>Order request received</h3>
              <p>Reference: {receipt.id}</p>
              <p>
                {receipt.status === "confirmed"
                  ? "Your order request has been confirmed by the company."
                  : "Your selected time windows are held while our team reviews the request."}
              </p>
            </div>
          ) : (
            <>
              <fieldset className="pv-method" disabled={busy}>
                <legend>Choose your delivery method</legend>
                <label>
                  <input
                    type="radio"
                    name="order-delivery-method"
                    checked={method === "self"}
                    onChange={() => {
                      calendarSerial.current++;
                      setAvailability(null);
                      setMethod("self");
                      setBookings([]);
                      invalidate();
                    }}
                  />
                  Self-arranged delivery
                </label>
                <label>
                  <input
                    type="radio"
                    name="order-delivery-method"
                    checked={method === "pickup"}
                    onChange={() => {
                      calendarSerial.current++;
                      setAvailability(null);
                      setMethod("pickup");
                      setBookings([]);
                      invalidate();
                    }}
                  />
                  Request pickup pricing
                </label>
              </fieldset>
              <p className="pv-note">
                {method === "self"
                  ? "Deliver to the receiving address using your own transport."
                  : "Provide your pickup address and select preferred pickup time windows."}
              </p>
              {!config && (
                <button
                  className="pv-text-button"
                  onClick={() => location.reload()}
                >
                  Reload delivery settings
                </button>
              )}
              {!bookingOpen ? (
                <button
                  className="pv-button"
                  disabled={busy || !config}
                  onClick={() => toggleBooking(true)}
                >
                  Place recycling order
                </button>
              ) : (
                <button
                  className="pv-text-button"
                  disabled={busy}
                  onClick={() => toggleBooking(false)}
                >
                  Back to delivery options
                </button>
              )}
              {bookingOpen && (
                <form className="pv-form pv-booking-form" onSubmit={submit}>
                  <fieldset className="pv-booking-fields" disabled={busy}>
                    <p>
                      {method === "self"
                        ? "Receiving address"
                        : "Recycling destination"}
                      : {config?.settings.address}
                    </p>
                    <p className="pv-note">
                      Calendar times use {config?.settings.timezone}.{" "}
                      {method === "self"
                        ? "Choose drop-off time windows."
                        : "Choose pickup time windows. Pickup and receiving capacity are scheduled separately."}
                    </p>
                    {bookings.map((b, i) => {
                      const day = availability?.days.find(
                        (d) => d.date === b.date,
                      );
                      return (
                        <fieldset
                          className={
                            "pv-booking-row" +
                            (activeBatch === i ? " is-active" : "")
                          }
                          key={i}
                          onFocusCapture={() => setActiveBatch(i)}
                        >
                          <legend>
                            {method === "self" ? "Drop-off" : "Pickup"} batch{" "}
                            {i + 1}
                          </legend>
                          <button
                            type="button"
                            className="pv-text-button"
                            aria-pressed={activeBatch === i}
                            onClick={() => {
                              setActiveBatch(i);
                              if (innerWidth < 961)
                                document
                                  .querySelector(".pv-month-calendar")
                                  ?.scrollIntoView({
                                    behavior: matchMedia(
                                      "(prefers-reduced-motion: reduce)",
                                    ).matches
                                      ? "auto"
                                      : "smooth",
                                  });
                            }}
                          >
                            Select date &amp; time on calendar
                          </button>
                          <label>
                            Selected date
                            <input
                              aria-label={"Batch " + (i + 1) + " date"}
                              type="date"
                              readOnly
                              min={availability?.days[0]?.date}
                              max={availability?.days.at(-1)?.date}
                              value={b.date}
                              required
                              onChange={(e) =>
                                booking(i, { date: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            Vehicle
                            <select
                              aria-label={"Batch " + (i + 1) + " vehicle"}
                              value={b.vehicle}
                              onChange={(e) =>
                                booking(i, {
                                  vehicle: e.target.value as
                                    "truck" | "trailer",
                                  count: 1,
                                })
                              }
                            >
                              <option value="truck">Truck</option>
                              <option value="trailer">Trailer</option>
                            </select>
                          </label>
                          <label>
                            Time window
                            <select
                              aria-label={"Batch " + (i + 1) + " time window"}
                              value={b.period}
                              onChange={(e) =>
                                booking(i, {
                                  period: e.target.value as "am" | "pm",
                                })
                              }
                            >
                              {(["am", "pm"] as const).map((period) => {
                                const slot = day?.periods.find(
                                  (p) => p.period === period,
                                );
                                const remaining = remainingFor(i, period);
                                return (
                                  <option
                                    key={period}
                                    value={period}
                                    disabled={!remaining}
                                  >
                                    {slot?.label ||
                                      (period === "am"
                                        ? "Morning"
                                        : "Afternoon")}{" "}
                                    · {remaining ?? 0} available
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                          <label>
                            Vehicle count
                            <input
                              aria-label={"Batch " + (i + 1) + " vehicle count"}
                              type="number"
                              min="1"
                              max={Math.max(1, remainingFor(i, b.period))}
                              value={b.count}
                              required
                              onChange={(e) =>
                                booking(i, { count: Number(e.target.value) })
                              }
                            />
                          </label>
                          {bookings.length > 1 && (
                            <button
                              type="button"
                              className="pv-text-button"
                              onClick={() => {
                                invalidate();
                                setBookings((previous) =>
                                  previous.filter((_, j) => j !== i),
                                );
                                setActiveBatch((previous) =>
                                  previous === i
                                    ? Math.max(0, i - 1)
                                    : previous > i
                                      ? previous - 1
                                      : previous,
                                );
                              }}
                            >
                              Remove batch {i + 1}
                            </button>
                          )}
                        </fieldset>
                      );
                    })}
                    <button
                      type="button"
                      className="pv-text-button"
                      disabled={bookings.length >= 30}
                      onClick={() => {
                        invalidate();
                        setActiveBatch(bookings.length);
                        setBookings((previous) => [
                          ...previous,
                          {
                            date: availability?.days[0]?.date || "",
                            period: "am",
                            vehicle: "truck",
                            count: 1,
                          },
                        ]);
                      }}
                    >
                      Add delivery batch
                    </button>
                    <button
                      type="button"
                      className="pv-text-button"
                      onClick={calendar}
                    >
                      Refresh available times
                    </button>
                    {method === "pickup" && (
                      <>
                        <PickupFields
                          value={pickup}
                          onChange={(next) => {
                            invalidate();
                            setPickup(next);
                          }}
                          estimatedWeightLb={cargo?.estimatedWeightLb ?? null}
                          estimatedGrossWeightLb={
                            cargo?.estimatedGrossWeightLb ?? null
                          }
                          estimatedPalletCount={
                            cargo?.estimatedPalletCount ?? 0
                          }
                          quantity={cargo?.quantity ?? 0}
                        />
                        {needed && (
                          <p>
                            Estimated required {bookings[0].vehicle} vehicles:{" "}
                            {needed.count}. Scheduled:{" "}
                            {bookings.reduce((n, b) => n + b.count, 0)}.
                            {needed.needsReview
                              ? " Some loading dimensions or weights require company confirmation."
                              : ""}
                          </p>
                        )}
                        {!loadFits && (
                          <p role="alert">
                            The scheduled vehicles cannot carry this shipment
                            under the calculated pallet layout and weight
                            limits. Add vehicles or delivery batches.
                          </p>
                        )}
                        <h3>Pickup location · United States</h3>
                        {(["street", "city", "state", "zip"] as const).map(
                          (field) => (
                            <label key={field}>
                              {
                                {
                                  street: "Street address",
                                  city: "City",
                                  state: "State (2-letter code)",
                                  zip: "ZIP code",
                                }[field]
                              }
                              <input
                                value={origin[field]}
                                required
                                minLength={
                                  field === "zip"
                                    ? 5
                                    : field === "state"
                                      ? 2
                                      : field === "street"
                                        ? 3
                                        : 2
                                }
                                maxLength={
                                  field === "state"
                                    ? 2
                                    : field === "zip"
                                      ? 5
                                      : field === "city"
                                        ? 100
                                        : 180
                                }
                                onChange={(e) => {
                                  invalidate();
                                  setOrigin((a) => ({
                                    ...a,
                                    [field]:
                                      field === "state"
                                        ? e.target.value.toUpperCase()
                                        : e.target.value,
                                  }));
                                }}
                              />
                            </label>
                          ),
                        )}
                        <p>
                          Pickup pricing updates automatically after your
                          address, schedule and preparation details are
                          complete.
                        </p>
                        {!freightReady && (
                          <p className="pv-note">
                            Pickup pricing will be reviewed with your request.
                            No transportation charge has been calculated.
                          </p>
                        )}
                        {freight && (
                          <>
                            <p>
                              {freight.distanceMiles.toFixed(1)} road miles per
                              vehicle
                            </p>
                            {freight.breakdown ? (
                              <FreightDetails
                                breakdown={freight.breakdown}
                                processing={quotation.processingTotal}
                              />
                            ) : (
                              <p>Pickup: {money(freight.amount)}</p>
                            )}
                          </>
                        )}
                      </>
                    )}
                    <h3>Contact details</h3>
                    {(["name", "email", "phone", "company"] as const).map(
                      (field) => (
                        <label key={field}>
                          {
                            {
                              name: "Contact name",
                              email: "Email",
                              phone: "Phone",
                              company: "Company (optional)",
                            }[field]
                          }
                          <input
                            type={
                              field === "email"
                                ? "email"
                                : field === "phone"
                                  ? "tel"
                                  : "text"
                            }
                            required={field !== "company"}
                            value={contact[field]}
                            minLength={
                              field === "name"
                                ? 2
                                : field === "phone"
                                  ? 7
                                  : undefined
                            }
                            maxLength={
                              field === "email"
                                ? 254
                                : field === "phone"
                                  ? 40
                                  : field === "name"
                                    ? 120
                                    : 160
                            }
                            onChange={(e) => {
                              key.current = crypto.randomUUID();
                              setContact((c) => ({
                                ...c,
                                [field]: e.target.value,
                              }));
                            }}
                          />
                        </label>
                      ),
                    )}
                    <p>
                      Processing:{" "}
                      {quotation.processingTotal === null
                        ? "Review required"
                        : money(quotation.processingTotal)}
                      <br />
                      Transportation:{" "}
                      {method === "self"
                        ? "Arranged by you"
                        : freight && !freight.breakdown?.pending.length
                          ? money(freight.amount)
                          : "Pending review"}
                      <br />
                      Applicable taxes are separate.
                    </p>
                    <label className="pv-accept">
                      <input
                        type="checkbox"
                        required
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                      />
                      I confirm the panel details and request these time
                      windows, subject to receiving requirements and company
                      confirmation.
                    </label>
                    <button
                      type="submit"
                      className="pv-button pv-order-submit"
                      disabled={
                        busy ||
                        !slotsValid ||
                        (method === "pickup" && freightReady && !freight)
                      }
                    >
                      {busy ? "Submitting…" : "Submit recycling order request"}
                    </button>
                  </fieldset>
                </form>
              )}
            </>
          )}
          {method === "pickup" && !freight && config && bookingOpen && (
            <FreightDetails
              processing={quotation.processingTotal}
              breakdown={{
                baseAmount: null,
                services: pickupCharges(pickup, config.settings.pickupFees)
                  .items,
                pending: [
                  "Base pickup transportation requires pricing",
                  ...pickupCharges(pickup, config.settings.pickupFees).pending,
                ],
                knownSubtotal: pickupCharges(pickup, config.settings.pickupFees)
                  .knownTotal,
              }}
            />
          )}
          {status && (
            <p className="pv-note" role="status">
              {status}
            </p>
          )}
          {status.startsWith("Pickup pricing is unavailable") &&
            freightReady &&
            slotsValid && (
              <button
                type="button"
                className="pv-text-button"
                disabled={busy}
                onClick={getFreight}
              >
                Retry pickup pricing
              </button>
            )}
        </div>
        {bookingOpen && !receipt && bookings.length > 0 && (
          <ReceivingCalendar
            availability={availability}
            date={bookings[Math.min(activeBatch, bookings.length - 1)].date}
            period={bookings[Math.min(activeBatch, bookings.length - 1)].period}
            count={bookings[Math.min(activeBatch, bookings.length - 1)].count}
            vehicle={
              bookings[Math.min(activeBatch, bookings.length - 1)].vehicle
            }
            batch={Math.min(activeBatch, bookings.length - 1) + 1}
            busy={busy}
            remaining={(date, period) =>
              remainingFor(
                Math.min(activeBatch, bookings.length - 1),
                period,
                date,
              )
            }
            onDate={(date) => {
              const i = Math.min(activeBatch, bookings.length - 1),
                b = bookings[i];
              const period =
                remainingFor(i, b.period, date) >= b.count
                  ? b.period
                  : remainingFor(i, "am", date) >= b.count
                    ? "am"
                    : "pm";
              booking(i, { date, period });
            }}
            onPeriod={(period) =>
              booking(Math.min(activeBatch, bookings.length - 1), { period })
            }
            onRefresh={calendar}
          />
        )}
      </div>
    </div>
  );
}
