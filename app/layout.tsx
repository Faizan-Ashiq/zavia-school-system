import "@/app/globals.css";

export const metadata = {
  title: "Zavia School System Portal",
  description: "Zavia School System Portal · School Management & Academic Portal",
  icons: {
    icon: "/Zavia.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
