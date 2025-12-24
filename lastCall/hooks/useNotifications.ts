import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotifications() {
    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

    useEffect(() => {
        // Request permissions and register for push notifications
        registerForPushNotifications();

        // Listen for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground:', notification);
            // You could show an in-app banner here
        });

        // Listen for user tapping on a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);

            // Handle deep linking based on notification data
            const data = response.notification.request.content.data as {
                scheduleId?: string;
                orgId?: string;
                type?: string;
            };

            if (data?.scheduleId && data?.orgId) {
                // Navigate to schedule page
                router.push(`/(app)/${data.orgId}/schedules` as any);
            } else if (data?.orgId) {
                // Navigate to organization dashboard
                router.push(`/(app)/${data.orgId}` as any);
            }
        });

        // Cleanup listeners on unmount
        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [router]);
}

async function registerForPushNotifications() {
    try {
        // Check if user is logged in before registering
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('User not logged in - skipping notification registration');
            return;
        }

        // Check if we're on a physical device (push notifications don't work in simulator)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
        console.log("Made it to status")
        // Request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        console.log("Made it past status")
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push notification permissions');
            return;
        }
        // Get the Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'cfb64a22-48e1-4fff-a2ff-f022f9d8274c',
        });

        // Save token to backend
        await api.updatePushToken(tokenData.data);
        console.log('Push token saved to backend');

    } catch (error) {
        console.error('Error registering for push notifications:', error);
    }
}
