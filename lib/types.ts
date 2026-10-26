export type Region={code:string;region:string;country:string;countryCode:string;currency:string;feeUnit:string;defaultFee:number;hourlyWage:number;baseRent:number;cam:number;rentUnit:string;electricityPrice:number;electricityUnit:string;landfillCost:number;landfillUnit:string;active:boolean;sortOrder:number};
export type Solution={code:string;name:string;provider:string;technologyType:string;capexUSD:number;capacity:number;operators:number;spaceSqFt:number;kwhPerPanel:number;consumablesUSDPerPanel:number;maintenanceRate:number;active:boolean;sortOrder:number};
export type OpexParam={countryCode:string;parameter:string;value:number;unit:string;currency:string;active:boolean};
export type Fx={currency:string;localPerUSD:number;effectiveDate:string;active:boolean};
export type Material={code:string;name:string;category:string;composition:number;benchmarkPrice:number|null;currency:string;priceUnit:string;active:boolean;sortOrder:number};
export type Recovery={solutionCode:string;materialCode:string;recoveryRate:number|null;realization:number|null;saleable:boolean;recoveredTreatment:string;unrecoveredTreatment:string;active:boolean};
export type MasterData={regions:Region[];solutions:Solution[];opex:OpexParam[];fx:Fx[];materials:Material[];recovery:Recovery[];source:'sharepoint'|'fallback'};
export type CalcInput={regionCode:string;panelsPerMonth:number;processingFee:number;solutionCodes:string[];panelWeightLb?:number};
