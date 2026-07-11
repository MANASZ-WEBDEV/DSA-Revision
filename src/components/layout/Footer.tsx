import { Link } from "react-router-dom";
import { s } from "./layoutStyles";

export function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <span>© {new Date().getFullYear()} DSA Recall</span>
        <div className="footer-links-grid" style={s.footerLinks}>
          <Link to="/how-to-use" style={s.footerLink}>How to Use</Link>
          <Link to="/about" style={s.footerLink}>About</Link>
          <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
          <Link to="/contact" style={s.footerLink}>Contact</Link>
          <Link to="/support" style={s.footerLink}>Support</Link>
          <Link to="/feedback" style={s.footerLink}>Feedback</Link>
          <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision" target="_blank" rel="noreferrer" style={s.footerLink}>GitHub</a>
        </div>
      </div>
    </footer>
  );
}
