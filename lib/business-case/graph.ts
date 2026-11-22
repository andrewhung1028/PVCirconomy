import {authConfig} from '../../server/auth/microsoft';
import {mailConfigured} from '../../server/delivery/communications';
/** Only used for mail, with www's existing Microsoft application configuration. */
export async function graph(path:string,init:RequestInit={}) {
 if(!mailConfigured())throw Error('mail_not_configured');const c=authConfig()!;
 const response=await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.client,client_secret:c.secret,grant_type:'client_credentials',scope:'https://graph.microsoft.com/.default'}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('mail_unavailable');const token=await response.json();
 const sent=await fetch('https://graph.microsoft.com/v1.0'+path,{...init,headers:{...init.headers,Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
 if(!sent.ok)throw Error('mail_unavailable');return sent.status===204||sent.status===202?null:sent.json();
}
