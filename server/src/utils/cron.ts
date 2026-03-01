import { supabase } from './../supabase.js'
import { sendNotificationSms } from './sms.js'

export function startCronJobs() {
    // Check every 10 minutes to grab appointments
    // Using a 10-minute interval allows us to catch appointments that precisely fall within the 24h window
    setInterval(async () => {
        try {
            if (!supabase) return;

            const nowMs = Date.now();

            // 1. Process 24-hour reminders
            const { data: upcomingBookings } = await supabase
                .from('bookings')
                .select('*, users(phone)')
                .in('status', ['confirmed'])

            if (upcomingBookings) {
                for (const booking of upcomingBookings) {
                    const bookingDate = new Date(`${booking.date}T${booking.time}`);
                    const diffHours = (bookingDate.getTime() - nowMs) / (1000 * 60 * 60);

                    // If it is between 23.8 to 24 hours away from current time
                    if (diffHours > 23.8 && diffHours <= 24.0) {
                        const phone = booking.users?.phone || booking.phone;
                        if (phone) {
                            const msgTemplate = process.env.ALIBABA_SMS_TEMPLATE_BOOKING_REMIND || 'SMS_BOOKING_REMIND';
                            console.log(`[Cron] Sending 24h reminder to ${phone} for booking ${booking.id}`);
                            await sendNotificationSms(phone, msgTemplate, { time: booking.time }).catch(console.error);
                        }
                    }
                }
            }

            // 2. Process expired bookings
            const { data: expiredBookings } = await supabase
                .from('bookings')
                .select('id, date, time, status')
                .in('status', ['pending', 'confirmed'])

            if (expiredBookings) {
                for (const booking of expiredBookings) {
                    const bookingDate = new Date(`${booking.date}T${booking.time}`);
                    const diffHours = (bookingDate.getTime() - nowMs) / (1000 * 60 * 60);

                    if (diffHours < 0) {
                        console.log(`[Cron] Marking booking ${booking.id} as expired`);
                        await supabase.from('bookings').update({ status: 'expired' }).eq('id', booking.id);
                    }
                }
            }

        } catch (err) {
            console.error('[Cron] Error running crons:', err);
        }
    }, 10 * 60 * 1000); // 10 minutes

    // Note: For immediately catching things on restart or testing, one could invoke it once on start.
    // We'll leave it as an interval.
}
