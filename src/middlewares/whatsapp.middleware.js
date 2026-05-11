const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

const SESSION_DIR = path.resolve(__dirname, "../../baileys_session");

// Pastikan folder session ada
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

let sock = null;
let isReady = false;
let reconnectTimeout = null;

async function connectWhatsApp() {
  try {
    console.log("🔄 Connecting to WhatsApp...");

    // Ambil state autentikasi
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // Buat socket baru
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // QR kita handle manual
      logger: pino({ level: "silent" }),
    });

    // Simpan kredensial saat update
    sock.ev.on("creds.update", saveCreds);

    // Tangani event connection.update
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n📱 QR Code baru, silakan scan:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        isReady = true;
        console.log("✅ WhatsApp terhubung!");
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      }

      if (connection === "close") {
        isReady = false;

        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.log(
            "🚪 Session sudah logout. Hapus folder 'baileys_session' dan restart aplikasi.",
          );
          // Jangan reconnect otomatis jika sudah logout
          return;
        }

        console.log(
          `⚠️ Koneksi terputus dengan kode ${statusCode}. Mencoba reconnect dalam 5 detik...`,
        );

        // Hindari multiple reconnect calls
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connectWhatsApp();
          }, 5000);
        }
      }
    });
  } catch (error) {
    console.error("❌ Gagal konek ke WhatsApp:", error);
    // Coba reconnect setelah delay jika error fatal
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectWhatsApp();
      }, 5000);
    }
  }
}

/**
 * Kirim pesan OTP ke nomor WhatsApp
 * @param {string} phone - nomor telepon, format 08xxx atau 628xxx
 * @param {string} otp - kode OTP 6 digit
 */
async function sendOTP(phone, otp) {
  if (!isReady || !sock) {
    throw new Error("WhatsApp belum siap, coba beberapa saat lagi.");
  }

  // Normalisasi nomor ke format internasional WA
  const normalized = phone.startsWith("0")
    ? "62" + phone.slice(1)
    : phone.replace(/^\+/, "");

  const jid = normalized + "@s.whatsapp.net";

  const message =
    `🔐 *Kode OTP Login*\n\n` +
    `Kode OTP kamu: *${otp}*\n\n` +
    `Berlaku selama *5 menit*.\n` +
    `Jangan bagikan kode ini ke siapapun.`;

  await sock.sendMessage(jid, { text: message });
  console.log(`📨 OTP terkirim ke ${normalized}`);
}

function isWhatsAppReady() {
  return isReady;
}

module.exports = { connectWhatsApp, sendOTP, isWhatsAppReady };
