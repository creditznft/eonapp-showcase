# EON Local Bridge — W659 developer preview

This optional user-started bridge exists only for browsers that block direct access from `https://eonapp.ch` to Ollama, LM Studio, Jan or ComfyUI.

It binds only to `127.0.0.1:17565`, requires a short-lived pairing code, allows exact EONAPP origins, and proxies only a fixed list of local AI API operations. It cannot access arbitrary URLs, LAN devices, files, shell commands, installers or cloud services.

Run `start-eon-local-bridge.cmd`, enter the displayed pairing code in EONAPP, and keep the window open while using local AI.

This source launcher requires Node.js 22+. It is not the final non-technical installer. Public release should use a signed packaged desktop companion with the same contract.
