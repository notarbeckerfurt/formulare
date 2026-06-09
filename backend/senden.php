<?php
/**
 * senden.php – Eigener, DSGVO-/§203-konformer Formular-Endpunkt der Kanzlei.
 *
 * Nimmt die Formulardaten (multipart/form-data ODER JSON) samt optionalem
 * PDF-Anhang entgegen und sendet sie AUSSCHLIESSLICH an das Kanzlei-Postfach.
 * Es liegt kein unbeteiligter Dritter dazwischen (anders als bei formsubmit.co).
 *
 * Keine externen Abhängigkeiten – läuft auf jedem Standard-PHP-Hosting (PHP 7.4+).
 * Deployment, Test und Rollout: siehe README.md
 */

# ============================ Konfiguration ============================
const RECIPIENT      = 'info@notar-beck-erfurt.de';       // Empfänger (Kanzlei)
const MAIL_FROM      = 'formular@notar-beck-erfurt.de';   // Absender auf EIGENER Domain (wichtig für SPF/DKIM)
const ALLOWED_ORIGIN = 'https://notarbeckerfurt.github.io'; // Herkunft der Formulare (GitHub Pages).
                                                          // '' setzen, falls die Formulare später auf dieselbe Domain wie senden.php umziehen.
const MAX_BYTES      = 12 * 1024 * 1024;                  // 12 MB Gesamt-Limit
const RATE_MAX       = 8;                                  // max. Sendungen ...
const RATE_WINDOW    = 600;                                // ... pro 600 s je IP-Adresse
# ======================================================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
if (ALLOWED_ORIGIN !== '') {
  header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Accept');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function respond_ok()            { echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE); exit; }
function respond_fail($c, $msg)  { http_response_code($c); echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST')              respond_fail(405, 'Nur POST erlaubt.');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BYTES)         respond_fail(413, 'Daten/Anhang zu groß.');

// --- Spam-Honeypot: verstecktes Feld _honey muss leer sein ---
if (!empty($_POST['_honey'])) respond_ok();   // Bot „erfolgreich“ abspeisen, aber nichts versenden

// --- Einfaches Rate-Limit je IP (dateibasiert) ---
$ip  = preg_replace('/[^0-9a-f:.]/i', '', $_SERVER['REMOTE_ADDR'] ?? '0');
$rl  = sys_get_temp_dir() . '/formlimit_' . md5($ip);
$now = time();
$hits = is_file($rl)
  ? array_filter(explode(',', (string)@file_get_contents($rl)), fn($t) => $now - (int)$t < RATE_WINDOW)
  : [];
if (count($hits) >= RATE_MAX) respond_fail(429, 'Zu viele Sendungen in kurzer Zeit. Bitte später erneut versuchen.');
$hits[] = $now;
@file_put_contents($rl, implode(',', $hits), LOCK_EX);

// --- Daten einsammeln (multipart ODER JSON) ---
$data = $_POST;
if (!$data) {
  $j = json_decode((string)file_get_contents('php://input'), true);
  if (is_array($j)) $data = $j;
}
if (!$data && empty($_FILES['attachment']['tmp_name'])) respond_fail(400, 'Keine Formulardaten empfangen.');

// --- Header-Injection-Schutz + Reply-To ermitteln ---
$clean = fn($s) => trim(str_replace(["\r", "\n"], ' ', (string)$s));
$replyTo = '';
foreach (['ausfueller_email', 'auftraggeber_email'] as $k) {
  if (!empty($data[$k]) && filter_var($data[$k], FILTER_VALIDATE_EMAIL)) { $replyTo = $clean($data[$k]); break; }
}
$formName = $clean($data['Formular'] ?? 'Online-Formular');

// --- Lesbare HTML-Tabelle aus den Feldern bauen ---
$rows = '';
foreach ($data as $k => $v) {
  if ($k === '' || $k[0] === '_') continue;                 // interne Felder (_subject, _honey …) überspringen
  $val = is_array($v) ? implode(', ', $v) : $v;
  $rows .= '<tr>'
        . '<td style="padding:5px 9px;border:1px solid #ddd;background:#f6f6f4;vertical-align:top;"><b>'
        . htmlspecialchars($k, ENT_QUOTES, 'UTF-8') . '</b></td>'
        . '<td style="padding:5px 9px;border:1px solid #ddd;">'
        . nl2br(htmlspecialchars($val, ENT_QUOTES, 'UTF-8')) . '</td>'
        . '</tr>';
}
$html = '<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;">'
      . '<h2 style="color:#142542;font-family:Georgia,serif;">' . htmlspecialchars($formName, ENT_QUOTES, 'UTF-8') . ' &ndash; Formulardaten</h2>'
      . '<table style="border-collapse:collapse;">' . $rows . '</table>'
      . '<p style="color:#999;font-size:12px;margin-top:16px;">Eingegangen über das Online-Formular der Kanzlei.</p>'
      . '</body></html>';

// --- MIME (multipart/mixed) zusammensetzen ---
$boundary = '=_b_' . bin2hex(random_bytes(12));
$headers  = 'From: ' . MAIL_FROM . "\r\n";
if ($replyTo) $headers .= 'Reply-To: ' . $replyTo . "\r\n";
$headers .= 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: multipart/mixed; boundary="' . $boundary . '"' . "\r\n";

$body  = '--' . $boundary . "\r\n"
       . 'Content-Type: text/html; charset=UTF-8' . "\r\n"
       . 'Content-Transfer-Encoding: base64' . "\r\n\r\n"
       . chunk_split(base64_encode($html)) . "\r\n";

// --- Optionaler PDF-Anhang (von den „komplexen“ Formularen) ---
if (!empty($_FILES['attachment']['tmp_name']) && is_uploaded_file($_FILES['attachment']['tmp_name'])
    && (int)$_FILES['attachment']['size'] <= MAX_BYTES) {
  $fname = preg_replace('/[^A-Za-z0-9._\- ]/', '_', $clean($_FILES['attachment']['name'] ?: 'Formular.pdf'));
  $pdf   = base64_encode((string)file_get_contents($_FILES['attachment']['tmp_name']));
  $body .= '--' . $boundary . "\r\n"
         . 'Content-Type: application/pdf; name="' . $fname . '"' . "\r\n"
         . 'Content-Transfer-Encoding: base64' . "\r\n"
         . 'Content-Disposition: attachment; filename="' . $fname . '"' . "\r\n\r\n"
         . chunk_split($pdf) . "\r\n";
}
$body .= '--' . $boundary . '--';

$subject = '=?UTF-8?B?' . base64_encode($formName . ' – Mandantendaten') . '?=';

// 5. Parameter (-f) setzt den Envelope-Absender → bessere Zustellbarkeit / SPF.
$sent = @mail(RECIPIENT, $subject, $body, $headers, '-f ' . MAIL_FROM);

if ($sent) respond_ok();
respond_fail(502, 'Versand fehlgeschlagen. Bitte später erneut versuchen oder die E-Mail-Alternative nutzen.');
