import { browser } from "wxt/browser";
import "./style.css";

const version = document.querySelector<HTMLParagraphElement>("#version");
if (version) {
  version.textContent = `Version ${browser.runtime.getManifest().version}`;
}
