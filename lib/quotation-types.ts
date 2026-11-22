import type {QuotationContact} from './quotation-contact';
import type {generateQuote,QuoteLine} from './batch-quote';import type {PricingSnapshot} from './pricing-rules';
export type QuotationBundle={recordId:string;accessToken:string;document:ReturnType<typeof generateQuote>;lines:QuoteLine[];pricing:PricingSnapshot;processingTotal:number|null;contact?:QuotationContact;expiresAt:string};
