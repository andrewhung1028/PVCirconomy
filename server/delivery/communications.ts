import {database} from '../db/client';
import {authConfig} from '../auth/microsoft';
let init:Promise<void>|null=null;
async function initialize(){if(!init)init=(async()=>{const sql=database();await sql`CREATE TABLE IF NOT EXISTS pv_mail_settings(singleton boolean PRIMARY KEY CHECK(singleton),sender text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),actor_email text)`;await sql`INSERT INTO pv_mail_settings(singleton,sender) VALUES(true,'terry.ko@pvcirconomy.com') ON CONFLICT(singleton) DO NOTHING`;await sql`CREATE TABLE IF NOT EXISTS pv_quotation_mail(quotation_id uuid PRIMARY KEY,recipient text NOT NULL,status text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),accepted_at timestamptz)`;await sql`ALTER TABLE pv_quotation_mail ADD COLUMN IF NOT EXISTS accepted_at timestamptz`})().catch(e=>{init=null;throw e});return init}
export function mailConfigured(){return !!authConfig()&&process.env.MICROSOFT_MAIL_ENABLED==='true'}
export async function mailSettings(){await initialize();const sql=database();const [row]=await sql`SELECT sender FROM pv_mail_settings WHERE singleton=true`;return {sender:row.sender as string,configured:mailConfigured()}}
export async function saveSender(sender:string,actor:string){await initialize();const sql=database();await sql`UPDATE pv_mail_settings SET sender=${sender},actor_email=${actor},updated_at=now() WHERE singleton=true`;return mailSettings()}
export async function sendDocumentEmail(id: string, email: string, message: { subject: string; html: string }): Promise<string> {
  if (!mailConfigured()) throw Error("mail_not_configured");
  const c = authConfig()!;
  const { sender } = await mailSettings();
  const sql = database();
  const [claim] = await sql`INSERT INTO pv_quotation_mail(quotation_id, recipient, status)
    VALUES(${id}::uuid, ${email}, 'sending') ON CONFLICT(quotation_id) DO NOTHING RETURNING quotation_id`;
  if (!claim) {
    const [prior] = await sql`SELECT status, COALESCE(accepted_at, created_at) AS accepted_at
      FROM pv_quotation_mail WHERE quotation_id=${id}::uuid`;
    if (prior?.status === "accepted") return new Date(prior.accepted_at).toISOString();
    throw Error("send_in_progress");
  }

  let sending = false;
  try {
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: c.client, client_secret: c.secret, grant_type: "client_credentials", scope: "https://graph.microsoft.com/.default" }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) throw Error("mail_unavailable");
    const token = await tokenResponse.json();
    sending = true;
    const sent = await fetch("https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(sender) + "/sendMail", {
      method: "POST",
      headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { subject: message.subject, body: { contentType: "HTML", content: message.html }, toRecipients: [{ emailAddress: { address: email } }] },
        saveToSentItems: true,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!sent.ok) {
      sending = false;
      throw Error("mail_unavailable");
    }
    const [accepted] = await sql`UPDATE pv_quotation_mail SET status='accepted', accepted_at=now()
      WHERE quotation_id=${id}::uuid RETURNING accepted_at`;
    return new Date(accepted.accepted_at).toISOString();
  } catch {
    if (!sending) await sql`DELETE FROM pv_quotation_mail WHERE quotation_id=${id}::uuid AND status='sending'`;
    throw Error(sending ? "send_in_progress" : "mail_unavailable");
  }
}

export const sendQuotation = sendDocumentEmail;

/** Share the configured sender and mail feature flag with business-case reports. */
export async function sendBusinessCaseMessage(message:Record<string,unknown>,attachments:{name:string;bytes:Buffer}[]) {
 if(!mailConfigured())throw Error('mail_not_configured');
 const {sendGraphMailWithAttachments}=await import('../../lib/business-case/graph-mail');
 await sendGraphMailWithAttachments((await mailSettings()).sender,message,attachments);
}
