import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Codebase Onboarding AI",
  description: "Understand any GitHub repository instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
