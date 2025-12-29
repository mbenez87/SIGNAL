import React from "react";

export default function WaitlistButton({ children }) {
  const handleClick = () => {
    // Placeholder for waitlist functionality
    alert("Waitlist feature coming soon!");
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
}