"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

const emptyItem = (): LineItem => ({ description: "", quantity: 1, rate: 0 });

export default function InvoiceGeneratorPage() {
  const { t } = useLang();
  const [invoiceNo, setInvoiceNo] = useState("INV-001");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [from, setFrom] = useState("Your Name\nYour Address\nCity, Country\nemail@example.com");
  const [to, setTo] = useState("Client Name\nClient Address\nCity, Country");
  const [items, setItems] = useState<LineItem[]>([{ description: "Service fee", quantity: 1, rate: 100 }]);
  const [notes, setNotes] = useState("Thank you for your business!");
  const [tax, setTax] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [generating, setGenerating] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([612, 792]);
      const { width } = page.getSize();

      page.drawText("INVOICE", { x: 50, y: 720, size: 24, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`#${invoiceNo}`, { x: 50, y: 695, size: 12, color: rgb(0.5, 0.5, 0.5) });
      page.drawText(`Date: ${date}`, { x: width - 200, y: 720, size: 10, color: rgb(0.3, 0.3, 0.3) });

      let currentPage = page;
      const cleanAscii = (str: string) => str.replace(/[^\x00-\x7F]/g, " ").trim();

      const drawTextBlock = (text: string, x: number, startY: number) => {
        const lines = text.split("\n");
        lines.forEach((line, i) => {
          currentPage.drawText(cleanAscii(line), { x, y: startY - i * 16, size: 10, color: rgb(0.2, 0.2, 0.2) });
        });
      };

      currentPage.drawText("From:", { x: 50, y: 660, size: 10, color: rgb(0.5, 0.5, 0.5) });
      drawTextBlock(from, 50, 645);
      currentPage.drawText("To:", { x: 350, y: 660, size: 10, color: rgb(0.5, 0.5, 0.5) });
      drawTextBlock(to, 350, 645);

      let y = 530;
      currentPage.drawText("Description", { x: 50, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
      currentPage.drawText("Qty", { x: 350, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
      currentPage.drawText("Rate", { x: 420, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
      currentPage.drawText("Amount", { x: 500, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
      y -= 20;

      for (const item of items) {
        if (y < 120) {
          currentPage = doc.addPage([595.28, 841.89]);
          y = 780;
          currentPage.drawText("Description", { x: 50, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
          currentPage.drawText("Qty", { x: 350, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
          currentPage.drawText("Rate", { x: 420, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
          currentPage.drawText("Amount", { x: 500, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
          y -= 20;
        }

        const amt = item.quantity * item.rate;
        const cleanDesc = cleanAscii(item.description || "-").slice(0, 48);
        currentPage.drawText(cleanDesc, { x: 50, y, size: 10, color: rgb(0.2, 0.2, 0.2) });
        currentPage.drawText(String(item.quantity), { x: 350, y, size: 10, color: rgb(0.2, 0.2, 0.2) });
        currentPage.drawText(`${cleanAscii(currency)} ${item.rate.toFixed(2)}`, { x: 420, y, size: 10, color: rgb(0.2, 0.2, 0.2) });
        currentPage.drawText(`${cleanAscii(currency)} ${amt.toFixed(2)}`, { x: 500, y, size: 10, color: rgb(0.2, 0.2, 0.2) });
        y -= 20;
      }

      if (y < 130) {
        currentPage = doc.addPage([595.28, 841.89]);
        y = 780;
      }

      y -= 10;
      currentPage.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      y -= 20;
      currentPage.drawText(`Subtotal: ${cleanAscii(currency)} ${subtotal.toFixed(2)}`, { x: 400, y, size: 10, color: rgb(0.3, 0.3, 0.3) });
      y -= 18;
      currentPage.drawText(`Tax (${tax}%): ${cleanAscii(currency)} ${taxAmount.toFixed(2)}`, { x: 400, y, size: 10, color: rgb(0.3, 0.3, 0.3) });
      y -= 22;
      currentPage.drawText(`Total: ${cleanAscii(currency)} ${total.toFixed(2)}`, { x: 400, y, size: 14, color: rgb(0.1, 0.1, 0.1) });

      if (notes) {
        if (y < 90) {
          currentPage = doc.addPage([595.28, 841.89]);
          y = 780;
        } else {
          y -= 40;
        }
        currentPage.drawText("Notes:", { x: 50, y, size: 10, color: rgb(0.5, 0.5, 0.5) });
        y -= 16;
        drawTextBlock(notes, 50, y);
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const link = document.createElement("a");
      link.download = `${invoiceNo}.pdf`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {} finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <ToolSeo title={t.invoiceTitle} description={t.invoiceDesc} path="/tools/invoice-generator" />
      <ToolPageLayout title={t.invoiceTitle} description={t.invoiceDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">{t.invoiceTitle2}</p>
                <div className="text-right">
                  <p className="font-mono text-sm text-foreground">{invoiceNo}</p>
                  <p className="text-xs text-text-secondary">{date}</p>
                </div>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-text-secondary">{t.invoiceFrom}</p>
                  <div className="rounded-lg border border-border bg-background p-3 text-xs text-foreground whitespace-pre-wrap">{from || "-"}</div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-text-secondary">{t.invoiceTo}</p>
                  <div className="rounded-lg border border-border bg-background p-3 text-xs text-foreground whitespace-pre-wrap">{to || "-"}</div>
                </div>
              </div>
              <div className="mb-4">
                {items.map((item, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder={t.invoiceDesc2} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    <input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", Number(e.target.value))} className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    <p className="w-24 text-right font-mono text-sm text-foreground">{currency} {(item.quantity * item.rate).toFixed(2)}</p>
                    {items.length > 1 && <button onClick={() => removeItem(i)} className="text-text-secondary hover:text-error"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                ))}
                <button onClick={addItem} className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"><Plus className="h-3 w-3" />{t.invoiceAddItem}</button>
              </div>
              <div className="border-t border-border pt-4 text-right space-y-1">
                <p className="text-sm text-text-secondary">{t.invoiceSubtotal}: <span className="font-mono text-foreground">{currency} {subtotal.toFixed(2)}</span></p>
                <p className="text-sm text-text-secondary">{t.invoiceTax}: <span className="font-mono text-foreground">{currency} {taxAmount.toFixed(2)}</span></p>
                <p className="text-lg font-bold text-foreground">{t.invoiceTotal}: {currency} {total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t.invoiceSettings}</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceNumber}</label>
                  <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceDate}</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceCurrency}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none">
                    {["USD", "EUR", "GBP", "IDR", "JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{t.invoiceTaxRate}</span><span>{tax}%</span>
                  </div>
                  <input type="range" min={0} max={30} value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceFrom2}</label>
                  <textarea value={from} onChange={(e) => setFrom(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceTo2}</label>
                  <textarea value={to} onChange={(e) => setTo(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t.invoiceNotes}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                </div>
              </div>
              <button onClick={generatePDF} disabled={generating} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="h-4 w-4" />{generating ? t.processing : t.invoiceDownload}
              </button>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}
