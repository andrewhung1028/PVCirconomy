import {defaultTransportLimits,defaultPickupFees,normalizeTransportLimits,validLimits,validPickupFees,type TransportLimits,type PickupFees} from './pickup';
import {isUsTimezone} from './us-timezones';
export type Vehicle='truck'|'trailer';export type Period='am'|'pm';export type DeliveryMethod='self'|'pickup';
export type Booking={date:string;period:Period;vehicle:Vehicle;count:number};
export type FreightRate={base:number|null;perMile:number|null;minimum:number|null};
export type DeliverySettings={transport:TransportLimits;pickupFees:PickupFees;address:string;timezone:string;openDays:number[];blockedDates:string[];truckCapacity:number;trailerCapacity:number;leadDays:number;horizonDays:number;morningLabel:string;afternoonLabel:string;rates:{truck:FreightRate;trailer:FreightRate}};
export type DeliverySnapshot={version:string;settings:DeliverySettings};
export const defaultDeliverySettings:DeliverySettings={transport:defaultTransportLimits,pickupFees:defaultPickupFees,address:'33380 Zeiders Road, Suite 103, Menifee, CA 92584, USA',timezone:'America/Los_Angeles',openDays:[0,1,2,3,4,5,6],blockedDates:[],truckCapacity:2,trailerCapacity:1,leadDays:1,horizonDays:60,morningLabel:'Morning',afternoonLabel:'Afternoon',rates:{truck:{base:null,perMile:null,minimum:null},trailer:{base:null,perMile:null,minimum:null}}};
export function normalizeDeliverySettings(v:unknown):DeliverySettings{const s=v&&typeof v==='object'?v as DeliverySettings:defaultDeliverySettings;return {...defaultDeliverySettings,...s,transport:normalizeTransportLimits(s.transport),pickupFees:{...defaultPickupFees,...s.pickupFees},rates:{truck:{...defaultDeliverySettings.rates.truck,...s.rates?.truck},trailer:{...defaultDeliverySettings.rates.trailer,...s.rates?.trailer}}}}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s}
export function dayInZone(timezone:string,now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function validDeliverySettings(v:unknown):v is DeliverySettings{if(!v||typeof v!=='object')return false;const s=v as DeliverySettings;if(!validLimits(s.transport)||!validPickupFees(s.pickupFees))return false;if(!isUsTimezone(s.timezone))return false;try{new Intl.DateTimeFormat('en-US',{timeZone:s.timezone}).format()}catch{return false}return typeof s.address==='string'&&s.address.trim().length>=10&&s.address.length<=300&&Array.isArray(s.openDays)&&s.openDays.length>0&&s.openDays.length<=7&&new Set(s.openDays).size===s.openDays.length&&s.openDays.every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&Array.isArray(s.blockedDates)&&s.blockedDates.length<=366&&s.blockedDates.every(d=>typeof d==='string'&&validDate(d))&&[s.truckCapacity,s.trailerCapacity].every(n=>Number.isInteger(n)&&n>=1&&n<=100)&&Number.isInteger(s.leadDays)&&s.leadDays>=0&&s.leadDays<=30&&Number.isInteger(s.horizonDays)&&s.horizonDays>=1&&s.horizonDays<=180&&s.leadDays<s.horizonDays&&[s.morningLabel,s.afternoonLabel].every(t=>typeof t==='string'&&t.trim().length>0&&t.length<=80)&&!!s.rates&&['truck','trailer'].every(k=>{const r=s.rates[k as Vehicle];return r&&['base','perMile','minimum'].every(f=>{const n=r[f as keyof FreightRate];return n===null||typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100000})})}
export function openDate(date:string,s:DeliverySettings,now=new Date()){if(!validDate(date))return false;const today=dayInZone(s.timezone,now);return date>=addDays(today,s.leadDays)&&date<=addDays(today,s.horizonDays)&&s.openDays.includes(new Date(date+'T12:00:00Z').getUTCDay())&&!s.blockedDates.includes(date)}
export function validBookings(v:unknown,s:DeliverySettings):v is Booking[]{return Array.isArray(v)&&v.length>=1&&v.length<=30&&v.every(b=>b&&typeof b.date==='string'&&openDate(b.date,s)&&['am','pm'].includes(b.period)&&['truck','trailer'].includes(b.vehicle)&&Number.isInteger(b.count)&&b.count>=1&&b.count<=100)}
export function canFit(trucks:number,trailers:number,s:DeliverySettings){return trucks*s.trailerCapacity+trailers*s.truckCapacity<=s.truckCapacity*s.trailerCapacity}
export function freightChargeForVehicle(miles: number, rate: FreightRate) {
  if (!Number.isFinite(miles) || miles < 0 || rate.base === null || rate.perMile === null || rate.minimum === null) return null;
  return Math.max(rate.minimum, rate.base + rate.perMile * miles);
}
export function calculateFreight(miles: number, bookings: Booking[], settings: DeliverySettings) {
  if (!Number.isFinite(miles) || miles < 0) return null;
  let total = 0;
  for (const booking of bookings) {
    const charge = freightChargeForVehicle(miles, settings.rates[booking.vehicle]);
    if (charge === null) return null;
    total += charge * booking.count;
  }
  return Math.round(total * 100) / 100;
}
export type OriginAddress={street:string;city:string;state:string;zip:string};
const states=new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));
export function validOrigin(v:unknown):v is OriginAddress{const a=v as OriginAddress;return !!a&&typeof a.street==='string'&&a.street.trim().length>=3&&a.street.length<=180&&typeof a.city==='string'&&a.city.trim().length>=2&&a.city.length<=100&&states.has(a.state)&&typeof a.zip==='string'&&/^\d{5}$/.test(a.zip)}
