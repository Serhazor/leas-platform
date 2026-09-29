import "server-only";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  fromName?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

/** Builds the "From" header: settings sender name + address from EMAIL_FROM. */
function fromHeader(fromName?: string): string {
  const configured = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
  const name = fromName?.trim() || configured.match(/^([^<]+)</)?.[1]?.trim();
  return name ? `${name.replace(/[<>"]/g, "")} <${address}>` : address;
}

/** Resend (https://resend.com) through its HTTP API — no SDK needed. */
class ResendProvider implements EmailProvider {
  readonly name = "resend";
  constructor(private apiKey: string) {}
  async send(message: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromHeader(message.fromName),
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo || undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`Resend ${res.status}: ${await res.text()}`);
    }
  }
}

/** Development fallback: prints e-mails to the server console. */
class ConsoleProvider implements EmailProvider {
  readonly name = "console";
  async send(message: EmailMessage) {
    console.info(`\n[e-mail] À : ${[message.to].flat().join(", ")}\n[e-mail] Objet : ${message.subject}\n${message.text}\n`);
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    const key = process.env.RESEND_API_KEY;
    provider = key ? new ResendProvider(key) : new ConsoleProvider();
  }
  return provider;
}
