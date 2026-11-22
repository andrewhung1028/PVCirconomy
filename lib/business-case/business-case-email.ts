import {sendBusinessCaseMessage,mailConfigured} from '../../server/delivery/communications';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { createBusinessCasePdf } from './business-case-pdf';
import {solutionLabel} from './solution-labels';

export type EmailStatus = 'accepted' | 'not_configured' | 'failed';
export type EmailResult = {status: EmailStatus; errorCode?: string};

/** Graph acceptance means queued by Microsoft, not confirmed delivery. */
export async function sendBusinessCaseEmail(
  email: string,
  name: string,
  calculationId: string,
  result: any,
  timeZone = 'UTC',
  generatedAt = new Date()
): Promise<EmailResult> {
  if (!mailConfigured()) return {status: 'not_configured'};

  const money = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: result.region.currency,
    maximumFractionDigits: 0,
  }).format(amount);
  const lines = [
    `Hello ${name || 'there'},`, '',
    'Thank you for your interest in PV Circonomy.', '',
    'I have attached your Business Case report and our PV Circulator brochure for your review.',
    'Here is a quick summary based on the operating assumptions you selected:', '',
    `Reference: ${calculationId}`,
    `Operating region: ${result.region.region} (${result.region.code})`,
    `Panels per month: ${new Intl.NumberFormat('en-US').format(result.input.panelsPerMonth)}`,
    `FX: ${result.fx.localPerUSD} ${result.region.currency}/USD | Effective: ${result.fx.effectiveDate || 'Not specified'}`,
    `Processing fee: ${result.input.processingFee} ${result.region.feeUnit}`, '',
  ];
  for (const solution of result.solutions || []) {
    lines.push(
      solutionLabel(solution.code, solution.name),
      `Annual revenue: ${money(solution.annualRevenue)}`,
      `Annual OPEX: ${money(solution.annualOpex)}`,
      `Annual EBITDA: ${money(solution.annualEbitda)}`,
      ...(solution.simplePaybackYears != null
        ? [`Simple payback: ${Number(solution.simplePaybackYears).toFixed(1)} years`] : []),
      '',
    );
  }
  lines.push(
    'If helpful, we would be happy to review these assumptions with you and discuss how PV Circulator could fit your recycling operation.', '',
    'Please reply to this email with any questions or a convenient time to connect.', '',
    'Best regards,', 'PV Circonomy', '',
    'Calculations are illustrative and are not a quotation or guarantee.',
  );

  try {
    const [report, brochure] = await Promise.all([
      createBusinessCasePdf(result, calculationId, timeZone, generatedAt),
      readFile(path.join(process.cwd(), 'public/2026_PV_Circulator_Solution_Brochure.pdf')),
    ]);
    await sendBusinessCaseMessage({
      subject: `Your PV Recycling Business Case — ${calculationId}`,
      body: { contentType: 'Text', content: lines.join('\n') },
      toRecipients: [{ emailAddress: { address: email } }],
    }, [
      {name: `Business_Case_${calculationId}.pdf`, bytes: Buffer.from(report)},
      {name: '2026_PV_Circulator_Solution_Brochure.pdf', bytes: brochure},
    ]);
    return {status: 'accepted'};
  } catch (error) {
    console.error('Business case email was not accepted by Microsoft Graph', error);
    // Return only a bounded provider code; never expose Graph paths or raw errors.
    const message = error instanceof Error ? error.message : '';
    const match = message.match(/failed: (\d+) (.+)$/s);
    let providerCode = '';
    if (match) {
      try { providerCode = JSON.parse(match[2]).error?.code || ''; } catch {}
    }
    const knownCodes = ['ErrorAccessDenied', 'Authorization_RequestDenied',
      'InvalidAuthenticationToken', 'Request_ResourceNotFound', 'ErrorInvalidUser',
      'ErrorInvalidMailbox', 'MailboxNotEnabledForRESTAPI', 'ErrorSendAsDenied',
      'ErrorMailboxNotEnabledForRESTAPI', 'ResourceNotFound'];
    return {status: 'failed', errorCode: knownCodes.includes(providerCode)
      ? providerCode : match ? `HTTP_${match[1]}` : 'MAIL_SEND_FAILED'};
  }
}
