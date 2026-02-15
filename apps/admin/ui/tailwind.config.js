/** @type {import('tailwindcss').config} */
export default {
  // Build รันจาก apps/admin ดังนั้นต้องชี้ไปที่โฟลเดอร์ ui/
  content: ["./ui/index.html", "./ui/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
