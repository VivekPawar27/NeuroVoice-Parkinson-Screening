import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState("all");

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/notifications`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filterRead === "unread") return !notif.read;
    if (filterRead === "read") return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 30%, rgba(207, 229, 213, 0.5), transparent), radial-gradient(circle at 90% 70%, rgba(166, 210, 200, 0.4), transparent), radial-gradient(circle at 50% 100%, rgba(184, 214, 178, 0.3), transparent), linear-gradient(135deg, #f9fefb 0%, #CFE5D5 35%, #A6D2C8 70%, #CFE5D5 100%)"
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2" style={{backgroundImage: "linear-gradient(135deg, #6EA89E 0%, #8FC6B7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}>🔔 Notifications</h1>
          <p className="font-semibold text-lg" style={{color: "#6EA89E"}}>Stay updated with patient screening alerts</p>
        </div>

        {/* Filter and Stats */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 shadow-lg mb-6" style={{borderColor: "#CFE5D5", borderWidth: "2px"}}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-semibold" style={{color: "#6EA89E"}}>TOTAL NOTIFICATIONS</p>
              <p className="text-4xl font-bold" style={{color: "#6EA89E"}}>{notifications.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-red-700">UNREAD</p>
              <p className="text-4xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{color: "#228B22"}}>READ</p>
              <p className="text-4xl font-bold" style={{color: "#228B22"}}>{notifications.length - unreadCount}</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilterRead("all")}
              className="px-4 py-2 rounded-lg font-semibold transition"
              style={{
                backgroundColor: filterRead === "all" ? "#6EA89E" : "rgba(207, 229, 213, 0.5)",
                color: filterRead === "all" ? "white" : "#6EA89E"
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterRead("unread")}
              className="px-4 py-2 rounded-lg font-semibold transition"
              style={{
                backgroundColor: filterRead === "unread" ? "#e50000" : "rgba(255, 100, 100, 0.2)",
                color: filterRead === "unread" ? "white" : "#e50000"
              }}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilterRead("read")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterRead === "read"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-teal-200 text-center">
              <p className="text-teal-700 text-lg">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-teal-200 text-center">
              <p className="text-teal-700 text-lg">✨ No {filterRead !== "all" ? filterRead : ""} notifications</p>
              <p className="text-teal-600 mt-2">All caught up!</p>
            </div>
          ) : (
            <>
              {filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-white/85 backdrop-blur-md rounded-3xl p-6 shadow-lg border-l-4 transition hover:shadow-xl ${
                    notif.read
                      ? "border-gray-400 opacity-75"
                      : "border-teal-500 border border-teal-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-teal-900">{notif.patient_name}</h3>
                        {!notif.read && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-teal-700 text-lg font-semibold">{notif.message}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-teal-600 mb-2">
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-teal-500">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="mt-3 px-4 py-2 bg-teal-100 text-teal-800 font-bold rounded-lg hover:bg-teal-200 transition"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition shadow-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
