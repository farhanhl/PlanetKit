"use client";

import { useState } from "react";
import { useLang } from "@/app/lib/i18n/context";
import ToolPageLayout from "@/app/components/ToolPageLayout";
import ToolSeo from "@/app/components/ToolSeo";

export default function PasswordStrengthPage() {
  const { t } = useLang();
  const [password, setPassword] = useState("");

  const analysis = analyzePassword(password);

  return (
    <>
      <ToolSeo title={t.pwStrengthTitle} description={t.pwStrengthDesc} path="/tools/password-strength" />
      <ToolPageLayout title={t.pwStrengthTitle} description={t.pwStrengthDesc}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.pwStrengthPlaceholder} className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-text-secondary/50 focus:border-accent focus:outline-none" />
            {password && (
              <div className="mt-6 rounded-xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{t.strength}</p>
                  <span className={`text-sm font-bold ${analysis.color}`}>{analysis.label}</span>
                </div>
                <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-background">
                  <div className={`h-full rounded-full transition-all duration-300 ${analysis.barColor}`} style={{ width: `${analysis.score}%` }} />
                </div>
                <div className="space-y-3">
                  {analysis.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-sm ${check.pass ? "text-success" : "text-text-secondary"}`}>{check.pass ? "✓" : "○"}</span>
                      <span className="text-sm text-text-secondary">{check.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg bg-background p-4">
                  <p className="mb-2 text-xs font-medium text-text-secondary">{t.estimatedCrack}</p>
                  <p className="text-sm font-semibold text-foreground">{analysis.crackTime}</p>
                </div>
              </div>
            )}
            {!password && (
              <div className="mt-6 flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-text-secondary">
                {t.pwStrengthEmpty}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.pwStrengthNote}</h3>
              <p className="text-xs text-text-secondary">{t.pwStrengthDesc2}</p>
            </div>
          </div>
        </div>
      </ToolPageLayout>
    </>
  );
}

function analyzePassword(pw: string) {
  if (!pw) return { score: 0, label: "", color: "", barColor: "", checks: getChecks(pw), crackTime: "" };

  let score = 0;
  if (pw.length >= 8) score += 15;
  if (pw.length >= 12) score += 15;
  if (pw.length >= 16) score += 10;
  if (/[a-z]/.test(pw)) score += 10;
  if (/[A-Z]/.test(pw)) score += 10;
  if (/[0-9]/.test(pw)) score += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 15;
  if (/(.)\1{2,}/.test(pw)) score -= 10;
  if (/^[a-zA-Z]+$/.test(pw)) score -= 10;
  if (/^[0-9]+$/.test(pw)) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const entropy = calcEntropy(pw);
  let crackTime = "";
  if (entropy < 28) crackTime = "< 1 second";
  else if (entropy < 36) crackTime = "~ minutes";
  else if (entropy < 60) crackTime = "~ hours";
  else if (entropy < 80) crackTime = "~ years";
  else crackTime = "~ centuries+";

  if (score < 30) return { score, label: "Weak", color: "text-error", barColor: "bg-error", checks: getChecks(pw), crackTime };
  if (score < 60) return { score, label: "Fair", color: "text-yellow-500", barColor: "bg-yellow-500", checks: getChecks(pw), crackTime };
  if (score < 80) return { score, label: "Strong", color: "text-accent", barColor: "bg-accent", checks: getChecks(pw), crackTime };
  return { score, label: "Very Strong", color: "text-success", barColor: "bg-success", checks: getChecks(pw), crackTime };
}

function getChecks(pw: string) {
  return [
    { label: "8+ characters", pass: pw.length >= 8 },
    { label: "12+ characters", pass: pw.length >= 12 },
    { label: "Lowercase letters", pass: /[a-z]/.test(pw) },
    { label: "Uppercase letters", pass: /[A-Z]/.test(pw) },
    { label: "Numbers", pass: /[0-9]/.test(pw) },
    { label: "Special characters", pass: /[^a-zA-Z0-9]/.test(pw) },
  ];
}

function calcEntropy(pw: string): number {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  return pool > 0 ? pw.length * Math.log2(pool) : 0;
}
