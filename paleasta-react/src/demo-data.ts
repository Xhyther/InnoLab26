import type { BusinessState, Transaction, Loan } from "./types.ts";

export const DEMO_DATE = "2026-10-27";
export const STORAGE_KEY = "paleasta-prototype-v1";
export function createDemoState(): BusinessState {
  const recent: Transaction[] = [
    {
      id: "t1",
      date: "2026-10-26",
      description: "Lucky Me! Pancit Canton retail sale",
      category: "Instant noodles",
      type: "inflow",
      amountCents: 43200,
      payment: "Cash",
      evidence: "Self-reported",
    },
    {
      id: "t2",
      date: "2026-10-26",
      description: "Coca-Cola & Royal restock",
      category: "Restock",
      type: "outflow",
      amountCents: 185000,
      payment: "Bank transfer",
      evidence: "Receipt attached",
      receiptName: "beverage-receipt.jpg",
    },
    {
      id: "t3",
      date: "2026-10-26",
      description: "Morning retail sales",
      category: "Retail sales",
      type: "inflow",
      amountCents: 141800,
      payment: "Cash",
      evidence: "Owner-confirmed",
    },
    {
      id: "t4",
      date: "2026-10-25",
      description: "Meralco store electricity bill",
      category: "Utilities",
      type: "outflow",
      amountCents: 62000,
      payment: "Maya",
      evidence: "Receipt attached",
      receiptName: "electricity.pdf",
    },
    {
      id: "t5",
      date: "2026-10-25",
      description: "Rice sack 25 kg wholesale",
      category: "Restock",
      type: "outflow",
      amountCents: 125000,
      payment: "Cash",
      evidence: "Receipt attached",
      receiptName: "rice-receipt.jpg",
    },
    {
      id: "t6",
      date: "2026-10-25",
      description: "Afternoon sundry sales",
      category: "Retail sales",
      type: "inflow",
      amountCents: 89000,
      payment: "Cash",
      evidence: "Self-reported",
    },
    {
      id: "t7",
      date: "2026-10-24",
      description: "PLDT Barangay WiFi",
      category: "Operating expense",
      type: "outflow",
      amountCents: 50000,
      payment: "GCash",
      evidence: "Receipt attached",
      receiptName: "wifi.pdf",
    },
    {
      id: "t8",
      date: "2026-10-24",
      description: "Cooking oil & condiments",
      category: "Restock",
      type: "outflow",
      amountCents: 78000,
      payment: "Cash",
      evidence: "Receipt attached",
      receiptName: "oil-receipt.jpg",
    },
  ];
  const earlier: Transaction[] = Array.from({ length: 20 }, (_, i) => {
    const date = `2026-10-${String(20 - i).padStart(2, "0")}`;
    return [
      {
        id: `s${i}`,
        date,
        description: "Daily store sales",
        category: "Retail sales",
        type: "inflow" as const,
        amountCents: 211300,
        payment: "Cash",
        evidence: "Self-reported" as const,
      },
      {
        id: `e${i}`,
        date,
        description: "Store supplies and operating costs",
        category: "Operating expense",
        type: "outflow" as const,
        amountCents: 17500,
        payment: "Cash",
        evidence:
          i < 11 ? ("Receipt attached" as const) : ("Self-reported" as const),
        ...(i < 11 ? { receiptName: `sample-receipt-${i + 1}.jpg` } : {}),
      },
    ];
  }).flat();
  const history:Transaction[]=[];
  for(let month=5;month<=9;month++){
    const days=new Date(Date.UTC(2026,month,0)).getUTCDate();
    for(let day=1;day<=days;day++){
      if(new Date(Date.UTC(2026,month-1,day)).getUTCDay()===0)continue;
      const date="2026-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
      history.push({id:"hist-"+date+"-in",date,description:"Daily retail sales",category:"Retail sales",type:"inflow",amountCents:(1320+(month-5)*75+(day*67+month*23)%760)*100,payment:day%3===0?"GCash":"Cash",evidence:"Owner-confirmed"});
      const attached=day%3!==0;
      history.push({id:"hist-"+date+"-out",date,description:["Mixed grocery restock","Beverage stock replenishment","Rice and noodle restock"][day%3],category:"Restock",type:"outflow",amountCents:(780+(month-5)*50+(day*41+month*17)%560)*100,payment:day%4===0?"Bank transfer":"Cash",evidence:attached?"Receipt attached":"Self-reported",...(attached?{receiptName:"sample-restock-"+date+".pdf"}:{})});
    }
    history.push({id:"hist-2026-"+month+"-electric",date:"2026-"+String(month).padStart(2,"0")+"-15",description:"Store electricity bill",category:"Utilities",type:"outflow",amountCents:62000+(month-5)*1800,payment:"Maya",evidence:"Receipt attached",receiptName:"sample-electricity-"+month+"-2026.pdf"});
  }
  const loans:Loan[]=[
    {id:"sample-loan-coop-2026",lender:"Sample cooperative loan",outstandingCents:3000000,repaymentCents:350000,repaymentFrequency:"monthly",balanceAsOfDate:"2026-10-27",nextDueDate:"2026-10-30",status:"current"},
    {id:"sample-loan-working-2026",lender:"Sample working-capital loan",outstandingCents:1500000,repaymentCents:150000,repaymentFrequency:"weekly",balanceAsOfDate:"2026-10-27",nextDueDate:"2026-11-02",status:"current"},
  ];
  const funding:Transaction[]=loans.map((loan,i)=>({id:"sample-funding-"+loan.id,date:i===0?"2026-10-05":"2026-10-26",description:"Loan proceeds · "+loan.lender,category:"Loan proceeds",type:"inflow",amountCents:loan.outstandingCents,payment:"Bank transfer",evidence:"Self-reported",cashKind:"loan_disbursement",loanId:loan.id}));
  return {
    version: 1,
    sampleRevision:3,
    loans,
    transactions: [...recent, ...earlier, ...funding, ...history].sort((a,b)=>b.date.localeCompare(a.date)),
    products: [
      {
        id: "p1",
        name: "Pancit Canton 80 g",
        category: "Instant noodles",
        quantity: 40,
        unit: "pcs",
        costCents: 1250,
        priceCents: 1600,
        threshold: 10,
        supplier: "San Juan Wholesale",
        barcode: "4800016644026",
      },
      {
        id: "p2",
        name: "Coca-Cola 1 L",
        category: "Beverages",
        quantity: 8,
        unit: "btls",
        costCents: 4000,
        priceCents: 5000,
        threshold: 10,
        supplier: "San Juan Grocery",
        barcode: "",
      },
      {
        id: "p3",
        name: "Well-milled rice",
        category: "Staple food",
        quantity: 75,
        unit: "kg",
        costCents: 4200,
        priceCents: 4800,
        threshold: 15,
        supplier: "Wholesale market",
        barcode: "",
      },
      {
        id: "p4",
        name: "3-in-1 coffee",
        category: "Beverages",
        quantity: 32,
        unit: "pcs",
        costCents: 600,
        priceCents: 800,
        threshold: 10,
        supplier: "San Juan Wholesale",
        barcode: "",
      },
      {
        id: "p5",
        name: "Cooking oil 1 L",
        category: "Cooking essentials",
        quantity: 6,
        unit: "btls",
        costCents: 8500,
        priceCents: 10000,
        threshold: 10,
        supplier: "Wholesale market",
        barcode: "",
      },
      {
        id: "p6",
        name: "Fresh eggs",
        category: "Everyday essentials",
        quantity: 24,
        unit: "pcs",
        costCents: 600,
        priceCents: 800,
        threshold: 10,
        supplier: "Local supplier",
        barcode: "",
      },
    ],
    profile: {
      name: "Nena's Sari-Sari Store",
      owner: "Elena Ramos",
      mobile: "",
      location: "Pinagbuhatan, Pasig City",
      businessType: "Sari-sari store",
    },
    preferences: {
      language: "Tagalog & English",
      reminder: "18:00",
      leaContext: true,
    },
  };
}
