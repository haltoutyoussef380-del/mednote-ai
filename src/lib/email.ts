
export async function sendEmailSimulation(to: string, subject: string, body: string) {
    // In a real app, we would use Resend, SendGrid, or AWS SES here.
    // For this MVP, we simulate the delay and log the email.

    console.log(`[EMAIL SIMULATION] Sending to: ${to}`);
    console.log(`[EMAIL SIMULATION] Subject: ${subject}`);
    console.log(`[EMAIL SIMULATION] Body: ${body}`);

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    return { success: true };
}
