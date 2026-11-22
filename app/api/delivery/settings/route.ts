import {deliverySettings} from '../../../../server/delivery/store';import {reply} from '../../../../server/delivery/http';
export const runtime='nodejs';export async function GET(){try{return reply({...await deliverySettings(),mapsConfigured:!!process.env.GOOGLE_MAPS_API_KEY})}catch{return reply({error:'delivery_unavailable'},503)}}
