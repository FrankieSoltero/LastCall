import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high'
    };

    try {
        const tickets = await expo.sendPushNotificationsAsync([message]);

        console.log('Push notification sent:', tickets);

        for (const ticket of tickets) {
            if (ticket.status === 'error') {
                console.error(`Error sending notifications: ${ticket.message}`);
            }
        }
    } catch (error) {
        console.error('Failed to send push notifications', error);
    }
}

export async function sendBulkPushNotifications(
    notifications: Array<{
        pushToken: string;
        title: string;
        body: string;
        data?: Record<string, any>;
    }>
): Promise<void> {
    // Filter out invalid tokens and build messages
    const messages: ExpoPushMessage[] = notifications
        .filter(notif => Expo.isExpoPushToken(notif.pushToken))
        .map(notif => ({
            to: notif.pushToken,
            sound: 'default',
            title: notif.title,
            body: notif.body,
            data: notif.data || {},
            priority: 'high',
        }));

    // Expo recommends batching notifications
    const chunks = expo.chunkPushNotifications(messages);

    try {
        for (const chunk of chunks) {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            console.log(`Sent ${tickets.length} notifications`);

            // Check for errors
            for (const ticket of tickets) {
                if (ticket.status === 'error') {
                    console.error(`Error: ${ticket.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Failed to send bulk push notifications:', error);
    }
}
