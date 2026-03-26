import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchUnreadCount();
    // Refresh unread count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread`);
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <header className="text-white shadow-lg" style={{backgroundImage: "linear-gradient(135deg, #6EA89E 0%, #8FC6B7 50%, #B8D6B2 100%)"}}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <h1 className="text-3xl font-bold">🧠 NeuroVoice</h1>
        </div>

        {/* Right Navigation Icons */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 hover:bg-white/20 rounded-lg transition"
              title="Notifications"
            >
              <span className="text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-teal-900 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-teal-200">
                  <h3 className="font-bold text-lg">📬 Notifications ({notifications.length})</h3>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-teal-600">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-teal-200">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-teal-50 transition cursor-pointer ${
                          notif.read ? "opacity-60" : "bg-teal-50"
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-teal-800">{notif.patient_name}</p>
                          <span className="text-xs text-teal-600">
                            {new Date(notif.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-teal-700">{notif.message}</p>
                        {!notif.read && <div className="mt-2 w-2 h-2 bg-red-500 rounded-full"></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History */}
          <button
            onClick={() => navigate("/history")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/20 rounded-lg transition font-semibold"
            title="Patient History"
          >
            <span className="text-2xl">📋</span>
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
