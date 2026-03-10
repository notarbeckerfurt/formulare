import nodemailer from 'nodemailer';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

let warningShown = false;

function getTransport() {
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_FROM) {
    if (!warningShown) {
      console.warn('E-Mail-Versand deaktiviert: SMTP ist nicht vollständig konfiguriert.');
      warningShown = true;
    }
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined
  });
}

async function sendEmail(to: string[], subject: string, text: string) {
  const transport = getTransport();
  if (!transport || !to.length) {
    return;
  }

  await transport.sendMail({
    from: EMAIL_FROM,
    to: to.join(', '),
    subject,
    text
  });
}

export async function sendNewRequestNotification(approverEmails: string[], requesterName: string) {
  await sendEmail(approverEmails, 'Neuer Abwesenheitsantrag', `Ein neuer Antrag von ${requesterName} wartet auf Freigabe.`);
}

export async function sendDecisionNotification(employeeEmail: string, status: 'APPROVED' | 'REJECTED') {
  const statusText = status === 'APPROVED' ? 'genehmigt' : 'abgelehnt';
  await sendEmail([employeeEmail], 'Status Ihres Abwesenheitsantrags', `Ihr Antrag wurde ${statusText}.`);
}

export async function sendConflictWarning(email: string, conflictNames: string[]) {
  await sendEmail([email], 'Konfliktwarnung für Abwesenheitsantrag', `Ihr Antrag kollidiert mit: ${conflictNames.join(', ')}.`);
}
