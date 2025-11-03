export const metadata = {
  title: "Hospital SOP App",
  description: "SOP generator",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


