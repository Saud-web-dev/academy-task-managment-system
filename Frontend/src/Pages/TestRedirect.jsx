import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TestRedirect = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);
        console.log("📦 Test Page - User from localStorage:", user);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    } else {
      console.log("❌ Test Page - No user in localStorage");
    }
  }, []);

  const handleNavigateClick = () => {
    if (!userInfo) {
      alert("No user logged in!");
      return;
    }

    console.log("🔄 Testing navigate()...");
    if (userInfo.role === "teamLeader" || userInfo.role === "superAdmin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/layout/desboards");
    }
  };

  const handleWindowLocationClick = () => {
    if (!userInfo) {
      alert("No user logged in!");
      return;
    }

    console.log("🔄 Testing window.location.href...");
    if (userInfo.role === "teamLeader" || userInfo.role === "superAdmin") {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/layout/desboards";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Redirect Test Page</h1>

        <div className="bg-[#121212] p-6 rounded-lg mb-6 border border-neutral-800">
          <h2 className="text-xl font-semibold mb-4">User Info from localStorage:</h2>
          {userInfo ? (
            <pre className="bg-[#0a0a0a] p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-red-400">❌ No user logged in</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleNavigateClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Test Redirect with navigate()
          </button>

          <button
            onClick={handleWindowLocationClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Test Redirect with window.location.href
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Clear LocalStorage & Reload
          </button>
        </div>

        <div className="mt-8 text-sm text-neutral-400">
          <p>✅ Check browser console (F12) for detailed logs</p>
          <p>✅ This page helps debug redirect issues</p>
        </div>
      </div>
    </div>
  );
};

export default TestRedirect;
