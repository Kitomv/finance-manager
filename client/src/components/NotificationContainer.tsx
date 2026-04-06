import { useNotification } from '@/contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-amber-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-amber-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto border rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 fade-in-0 ${getBackgroundColor(
            notification.type
          )}`}
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0 pt-0.5">{getIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${getTitleColor(notification.type)}`}>
                {notification.title}
              </h3>
              <p className={`text-sm mt-1 ${getMessageColor(notification.type)}`}>
                {notification.message}
              </p>
              {notification.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    notification.action?.onClick();
                    removeNotification(notification.id);
                  }}
                  className="mt-2 h-8 text-xs"
                >
                  {notification.action.label}
                </Button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
