import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../global.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Navbar />
        <main style={{ flex: "1", position: "relative" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
