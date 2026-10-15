import { Injectable, ComponentRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { FuseAlertType } from '@fuse/components/alert';

export interface NotificationConfig {
    type: FuseAlertType;
    message: string;
    title?: string;
    duration?: number;
    dismissible?: boolean;
    appearance?: 'border' | 'fill' | 'outline' | 'soft';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private activeNotifications: Map<string, ComponentRef<any>> = new Map();
    private notificationId = 0;

    constructor(
        private appRef: ApplicationRef,
        private injector: EnvironmentInjector
    ) { }

    /**
     * Show success notification
     */
    success(message: string, title?: string): void {
        this.show({
            type: 'success',
            message,
            title: title || 'Uğurlu',
            duration: 4000,
            appearance: 'soft'
        });
    }

    /**
     * Show error notification
     */
    error(message: string, title?: string): void {
        this.show({
            type: 'error',
            message,
            title: title || 'Xəta',
            duration: 5000,
            appearance: 'soft'
        });
    }

    /**
     * Show warning notification
     */
    warning(message: string, title?: string): void {
        this.show({
            type: 'warning',
            message,
            title: title || 'Xəbərdarlıq',
            duration: 4000,
            appearance: 'soft'
        });
    }

    /**
     * Show info notification
     */
    info(message: string, title?: string): void {
        this.show({
            type: 'info',
            message,
            title: title || 'Məlumat',
            duration: 4000,
            appearance: 'soft'
        });
    }

    /**
     * Show notification with config
     */
    private show(config: NotificationConfig): void {
        const id = `notification-${this.notificationId++}`;
        
        // Create container if doesn't exist
        let container = document.getElementById('fuse-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'fuse-notification-container';
            container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md';
            document.body.appendChild(container);
        }

        // Create notification element
        const notificationWrapper = document.createElement('div');
        notificationWrapper.id = id;
        notificationWrapper.className = 'fuse-notification-wrapper animate-slide-in-right';
        notificationWrapper.innerHTML = this.getNotificationHTML(config);
        
        container.appendChild(notificationWrapper);

        // Add click listener for dismiss button
        const dismissBtn = notificationWrapper.querySelector('.fuse-notification-dismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismiss(id));
        }

        // Auto dismiss
        if (config.duration && config.duration > 0) {
            setTimeout(() => this.dismiss(id), config.duration);
        }
    }

    /**
     * Get notification HTML
     */
    private getNotificationHTML(config: NotificationConfig): string {
        const colors = this.getColors(config.type);
        
        return `
            <div class="${colors.container} rounded-lg shadow-lg p-4 border-l-4 ${colors.border} relative">
                <div class="flex items-start gap-3">
                    <div class="${colors.icon} rounded-full p-1 flex-shrink-0">
                        ${this.getIcon(config.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        ${config.title ? `<div class="font-semibold text-sm mb-1 ${colors.title}">${config.title}</div>` : ''}
                        <div class="text-sm ${colors.text}">${config.message}</div>
                    </div>
                    <button class="fuse-notification-dismiss ${colors.closeBtn} hover:${colors.closeBtnHover} rounded-full p-1 transition-colors flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get icon by type
     */
    private getIcon(type: FuseAlertType): string {
        const iconClass = 'w-5 h-5';
        switch (type) {
            case 'success':
                return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>`;
            case 'error':
                return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>`;
            case 'warning':
                return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>`;
            case 'info':
                return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`;
            default:
                return `<svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`;
        }
    }

    /**
     * Get colors by type
     */
    private getColors(type: FuseAlertType): any {
        switch (type) {
            case 'success':
                return {
                    container: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-500',
                    icon: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
                    title: 'text-green-900 dark:text-green-100',
                    text: 'text-green-800 dark:text-green-200',
                    closeBtn: 'text-green-600 dark:text-green-400',
                    closeBtnHover: 'bg-green-100 dark:bg-green-900/40'
                };
            case 'error':
                return {
                    container: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-500',
                    icon: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
                    title: 'text-red-900 dark:text-red-100',
                    text: 'text-red-800 dark:text-red-200',
                    closeBtn: 'text-red-600 dark:text-red-400',
                    closeBtnHover: 'bg-red-100 dark:bg-red-900/40'
                };
            case 'warning':
                return {
                    container: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-500',
                    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
                    title: 'text-orange-900 dark:text-orange-100',
                    text: 'text-orange-800 dark:text-orange-200',
                    closeBtn: 'text-orange-600 dark:text-orange-400',
                    closeBtnHover: 'bg-orange-100 dark:bg-orange-900/40'
                };
            case 'info':
                return {
                    container: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-500',
                    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
                    title: 'text-blue-900 dark:text-blue-100',
                    text: 'text-blue-800 dark:text-blue-200',
                    closeBtn: 'text-blue-600 dark:text-blue-400',
                    closeBtnHover: 'bg-blue-100 dark:bg-blue-900/40'
                };
            default:
                return {
                    container: 'bg-gray-50 dark:bg-gray-900/20',
                    border: 'border-gray-500',
                    icon: 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400',
                    title: 'text-gray-900 dark:text-gray-100',
                    text: 'text-gray-800 dark:text-gray-200',
                    closeBtn: 'text-gray-600 dark:text-gray-400',
                    closeBtnHover: 'bg-gray-100 dark:bg-gray-900/40'
                };
        }
    }

    /**
     * Dismiss notification
     */
    private dismiss(id: string): void {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('animate-slide-out-right');
            setTimeout(() => {
                element.remove();
                
                // Remove container if empty
                const container = document.getElementById('fuse-notification-container');
                if (container && container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }
    }

    /**
     * Dismiss all notifications
     */
    dismissAll(): void {
        const container = document.getElementById('fuse-notification-container');
        if (container) {
            container.remove();
        }
    }
}