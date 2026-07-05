/**
 * Email delivery is abstracted behind this interface so swapping in a
 * real provider (Resend, SendGrid, SMTP via Nodemailer) later means
 * implementing one method and changing one line below — nothing else
 * in the codebase imports a provider SDK directly.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development stand-in: logs the email to the server console instead of
 * sending it. This is intentionally NOT used in a way that fakes success
 * to the UI — the token/expiry/single-use logic in authService is fully
 * real; only the delivery transport is a placeholder, and it's logged
 * loudly so it's never mistaken for a working production email.
 */
class ConsoleEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    console.log('\n──────────────────────────────────────────────');
    console.log('📧  [DEV EMAIL — no provider configured]');
    console.log('To:', message.to);
    console.log('Subject:', message.subject);
    console.log('Body:\n', message.html.replace(/<[^>]+>/g, ''));
    console.log('──────────────────────────────────────────────\n');
  }
}

// Swap this single line for a real provider when ready, e.g.:
//   export const emailService: EmailService = new ResendEmailService();
export const emailService: EmailService = new ConsoleEmailService();

export function buildPasswordResetEmail(resetUrl: string): EmailMessage['html'] {
  return `
    <p>We received a request to reset your FreshMart password.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a> — this link expires in 30 minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;
}
