// app/[lang]/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
export const runtime = "nodejs";

type Payload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, company, phone, message } =
      (await request.json()) as Payload;

    // ---- Server-side validation ----
    const errors: string[] = [];

    if (!firstName?.trim()) errors.push("First name is required");
    if (!lastName?.trim()) errors.push("Last name is required");
    if (!email?.trim()) errors.push("Email is required");
    if (!message?.trim()) errors.push("Message is required");

    if (firstName && firstName.trim().length < 2)
      errors.push("First name must be at least 2 characters");
    if (lastName && lastName.trim().length < 2)
      errors.push("Last name must be at least 2 characters");

    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
    if (firstName && !nameRegex.test(firstName))
      errors.push("First name contains invalid characters");
    if (lastName && !nameRegex.test(lastName))
      errors.push("Last name contains invalid characters");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) errors.push("Invalid email format");

    const disposableEmails = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "throwaway.email",
      "temp-mail.org",
    ];
    if (email) {
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain && disposableEmails.includes(domain)) {
        errors.push("Disposable email addresses are not allowed");
      }
    }

    if (message && message.trim().length < 10)
      errors.push("Message must be at least 10 characters");
    if (message && message.length > 500)
      errors.push("Message must be 500 characters or less");

    if (phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        errors.push("Invalid phone format");
      } else {
        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length < 7 || digitsOnly.length > 15) {
          errors.push("Phone must be between 7 and 15 digits");
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // ---- EXACTLY as in your ENV ----
    const adminEmail = process.env.EMAIL_ADMIN; // <-- EMAIL_ADMIN
    const adminPass = process.env.EMAIL_PASSWORD; // <-- EMAIL_PASSWORD

    if (!adminEmail || !adminPass) {
      return NextResponse.json(
        {
          error:
            "Missing EMAIL_ADMIN or EMAIL_PASSWORD in environment variables.",
        },
        { status: 500 }
      );
    }

    // ---- Gmail SMTP ----
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: adminEmail,
        pass: adminPass,
      },
    });

    const safeMessage = (message ?? "").replace(/\n/g, "<br>");

    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #1f2937; color: #fff; padding: 20px; border-radius: 6px 6px 0 0; }
      .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 6px 6px; }
      .field { margin-bottom: 14px; }
      .label { font-weight: bold; color: #111827; }
      .value { color: #374151; margin-top: 4px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>New Contact Form Submission</h2>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">Name:</div>
          <div class="value">${firstName} ${lastName}</div>
        </div>

        <div class="field">
          <div class="label">Email:</div>
          <div class="value">${email}</div>
        </div>

        ${
          company?.trim()
            ? `<div class="field"><div class="label">Company:</div><div class="value">${company}</div></div>`
            : ""
        }

        ${
          phone?.trim()
            ? `<div class="field"><div class="label">Phone:</div><div class="value">${phone}</div></div>`
            : ""
        }

        <div class="field">
          <div class="label">Message:</div>
          <div class="value">${safeMessage}</div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

    await transporter.sendMail({
      from: adminEmail,          // отправитель = EMAIL_ADMIN
      to: adminEmail,            // получатель = EMAIL_ADMIN
      replyTo: email,            // ответ пойдёт клиенту
      subject: `New Contact Form: ${firstName} ${lastName}`,
      html: htmlContent,
      text: `Name: ${firstName} ${lastName}
Email: ${email}
Company: ${company || "N/A"}
Phone: ${phone || "N/A"}

Message:
${message}
`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
