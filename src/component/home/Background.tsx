"use Client";
import React from 'react'

const Background = () => {
  return (
   <div
    aria-hidden="true"
    className="fixed inset-0 -z-10 overflow-hidden"
    style={{
      background:
        "linear-gradient(145deg, #d6eaf8 0%, #c2dff0 30%, #b8d9ee 60%, #cae5f5 100%)",
    }}
  >
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ top: 120, left: -40, width: 340, height: 340, background: "#ffffff", opacity: 0.5, filter: "blur(80px)" }}
    />
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ top: "70%", left: "%", width: 420, height: 420, background: "#a8d8f0", opacity: 0.35, filter: "blur(80px)" }}
    />
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ top: "5%", left: "%", width: 280, height: 280, background: "#c8e8f8", opacity: 0.4, filter: "blur(80px)" }}
    />
  </div>
  )
}

export default Background
