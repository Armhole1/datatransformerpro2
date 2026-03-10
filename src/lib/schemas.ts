import { Type } from "@google/genai";

export const INVOICE_PROMPT = "Extract the following information from this invoice. If a value is missing, leave it empty or 0.";

export const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    invoiceNumber: { type: Type.STRING },
    date: { type: Type.STRING },
    vendorName: { type: Type.STRING },
    totalAmount: { type: Type.NUMBER },
    taxAmount: { type: Type.NUMBER },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
        },
      },
    },
  },
};

export const RECEIPT_PROMPT = "Extract the following information from this receipt. If a value is missing, leave it empty or 0.";

export const RECEIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    merchantName: { type: Type.STRING },
    date: { type: Type.STRING },
    time: { type: Type.STRING },
    totalAmount: { type: Type.NUMBER },
    taxAmount: { type: Type.NUMBER },
    paymentMethod: { type: Type.STRING },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
        },
      },
    },
  },
};

export const BANK_STATEMENT_PROMPT = "Extract the following information from this bank statement. If a value is missing, leave it empty or 0.";

export const BANK_STATEMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    bankName: { type: Type.STRING },
    accountNumber: { type: Type.STRING, description: "Last 4 digits only if possible" },
    statementDate: { type: Type.STRING },
    startingBalance: { type: Type.NUMBER },
    endingBalance: { type: Type.NUMBER },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, description: "CREDIT or DEBIT" },
        },
      },
    },
  },
};
