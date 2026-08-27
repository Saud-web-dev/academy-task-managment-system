import React from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "../Admin/components/Unauthorized";

const EmployeeRoute = ({ children }) => {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "employee") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default EmployeeRoute;