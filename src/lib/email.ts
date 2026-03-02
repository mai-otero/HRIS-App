/**
 * Email notification utility — server-side only.
 * Silently logs and returns if RESEND_API_KEY is not configured,
 * so PTO submissions always succeed even without email set up.
 */

import { Resend } from "resend";

export interface PtoNotificationOptions {
  employeeName: string;
  employeeEmail: string | null; // null = no employee email on file
  startDate: string;            // "YYYY-MM-DD"
  endDate: string;
  workingDays: number;
  remainingAfter: number;
  submittedByAdmin: boolean;
}

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function sendPtoNotification(opts: PtoNotificationOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping PTO notification email.");
    return;
  }

  const { employeeName, employeeEmail, startDate, endDate, workingDays, remainingAfter, submittedByAdmin } = opts;

  // Collect recipients
  const recipients = [
    process.env.ADMIN_EMAIL_1,
    process.env.ADMIN_EMAIL_2,
    employeeEmail,
  ].filter((e): e is string => Boolean(e?.trim()));

  const unique = [...new Set(recipients)];
  if (unique.length === 0) {
    console.warn("[email] No recipients configured — skipping PTO notification.");
    return;
  }

  const submitterNote = submittedByAdmin
    ? `This request was submitted by an administrator on behalf of ${employeeName}.`
    : `This request was submitted by ${employeeName}.`;

  const subject = `PTO request — ${employeeName}: ${fmtDate(startDate)} to ${fmtDate(endDate)}`;

  const text = [
    `PTO Request Confirmed`,
    ``,
    `Employee:       ${employeeName}`,
    `Dates:          ${fmtDate(startDate)} → ${fmtDate(endDate)}`,
    `Working days:   ${workingDays}`,
    `Remaining days: ${remainingAfter} (after this request)`,
    ``,
    submitterNote,
  ].join("\n");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
      to: unique,
      subject,
      text,
    });
  } catch (err) {
    console.error("[email] PTO notification failed:", err);
    // Never rethrow — email failure must never block PTO submission
  }
}
