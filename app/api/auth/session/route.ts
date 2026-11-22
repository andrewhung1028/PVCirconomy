import {mailConfigured} from '../../../../server/delivery/communications';
import {customerSession,googleConfig} from '../../../../server/auth/google';
import {authConfig,staffSession} from '../../../../server/auth/microsoft';
export const runtime='nodejs';export async function GET(){const staff=await staffSession();return Response.json({configured:!!authConfig(),googleConfigured:!!googleConfig(),mailConfigured:mailConfigured(),user:staff?{email:staff.email,name:staff.name,role:'staff'}:await customerSession()},{headers:{'Cache-Control':'no-store'}})}
