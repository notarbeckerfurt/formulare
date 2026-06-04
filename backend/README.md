# Eigener Formular-Versand (`senden.php`)

Ersetzt den US-Dienst **formsubmit.co** durch einen **eigenen Endpunkt** – bei Ihrem
Setup auf dem **Rockenstein-Webspace** (deutscher Hoster, AVV). Die Mandantendaten
gehen damit ausschließlich an Ihr eigenes Postfach – kein US-Dritter liest mit.
Das ist für eine Notarkanzlei der sauberste Weg (§ 203 StGB / § 18 BNotO),
beseitigt die Werbeblocker-/CDN-Probleme und hat keine Versand-Limits.
Der Mandant sendet weiterhin **mit einem Klick** direkt.

Keine externen Abhängigkeiten – läuft auf Standard-PHP (7.4+).

## Ihr Setup

```
Formular (GitHub Pages: notarbeckerfurt.github.io)
   │  POST (Daten + PDF)
   ▼
senden.php  (Rockenstein-Webspace, z.B. https://formular.notar-beck-erfurt.de/senden.php)
   │  E-Mail
   ▼
info@notar-beck-erfurt.de   (Postfach bei NotarNet)
```

---

## 1. Webspace bei Rockenstein
- Im Rockenstein-Kundenbereich prüfen, ob ein **Webhosting-Paket mit PHP** aktiv ist
  (Domain liegt dort, meist ist Webspace dabei). Falls nicht: kleines PHP-Paket dazubuchen.
- Eine **Subdomain** anlegen, z.B. `formular.notar-beck-erfurt.de`, und auf den Webspace zeigen lassen.

## 2. `senden.php` hochladen & konfigurieren
- Datei in das Webverzeichnis der Subdomain laden (Upload im Rockenstein-Dateimanager
  oder per SFTP, je nach Paket).
- Im Konfig-Block oben prüfen:
  - `RECIPIENT` = `info@notar-beck-erfurt.de` (Kanzlei-Postfach).
  - `MAIL_FROM` = Absender-Adresse (siehe Zustellbarkeit unten).
  - `ALLOWED_ORIGIN` = `https://notarbeckerfurt.github.io` (ist bereits gesetzt – die
    Herkunft Ihrer GitHub-Pages-Formulare; nötig, weil Formular und Endpunkt auf
    verschiedenen Domains liegen). Ziehen die Formulare später mit auf Rockenstein um,
    auf `''` ändern.

## 3. Zustellbarkeit beachten (Versand Rockenstein → Postfach NotarNet)
Die Mail wird von Rockenstein verschickt, das Postfach liegt aber bei NotarNet.
Damit sie nicht im Spam landet, **eine** der Varianten wählen:
- **Empfohlen:** In `senden.php` als `MAIL_FROM` eine **Rockenstein-Postfachadresse**
  verwenden (z.B. `formular@<ihre-rockenstein-domain>`) und per **SMTP** versenden
  (SMTP-Variante per PHPMailer, siehe unten). Dann passen SPF/DKIM automatisch.
- **Alternativ:** Im DNS der Domain den **SPF-Eintrag** um den Rockenstein-Mailserver
  ergänzen (DNS liegt bei Rockenstein → schnell gemacht), dann funktioniert auch der
  einfache `mail()`-Versand mit `MAIL_FROM = formular@notar-beck-erfurt.de`.
- Im Zweifel hilft **Rockenstein-Support** beim korrekten SPF-/Absender-Setup.

## 4. Test (vor dem Umstellen der Formulare!)
```bash
curl -s -X POST https://formular.notar-beck-erfurt.de/senden.php \
  -F "Formular=Testlauf" -F "Vorname=Max" -F "Nachname=Mustermann" \
  -F "ausfueller_email=test@example.com"
```
Erwartet: `{"success":true}` **und** eine E-Mail in `info@notar-beck-erfurt.de`.
Mit PDF-Anhang: zusätzlich `-F "attachment=@/pfad/test.pdf;type=application/pdf"`.

## 5. Formulare umstellen (erst nach erfolgreichem Test)
In allen 20 Formularen ändert sich nur **eine Zeile** – die Versand-Adresse:
```js
// vorher
fetch('https://formsubmit.co/ajax/info@notar-beck-erfurt.de', { … })
// nachher
fetch('https://formular.notar-beck-erfurt.de/senden.php', { method:'POST', body: formData })
```
Die bestehende Erfolgs-/Fehler-Logik (`data.success === true`) bleibt, weil
`senden.php` dieselbe Antwortform `{"success":true}` liefert.

> **Diese Umstellung übernehme ich** in einem Rutsch (wie bei den Robustheits-Fixes),
> sobald Sie mir die finale Endpunkt-URL bestätigt haben und der `curl`-Test klappt.

## 6. Sichere Rollout-Reihenfolge
1. `senden.php` hochladen + konfigurieren.
2. Zustellbarkeit (SPF/Absender) einrichten.
3. Mit `curl` testen → `{"success":true}` + Mail kommt an.
4. **Dann erst** die Formulare auf die neue URL umstellen.
5. Die bestehenden Ausweich-Wege (E-Mail/.eml) bleiben als Fallback erhalten.

---

## Optionale SMTP-Variante (beste Zustellbarkeit)
Statt `mail()` über ein Rockenstein-Postfach versenden – minimaler Umbau mit PHPMailer:
```php
// require 'PHPMailer/src/PHPMailer.php'; require 'PHPMailer/src/SMTP.php';
$m = new PHPMailer\PHPMailer\PHPMailer(true);
$m->isSMTP(); $m->Host='smtp.<rockenstein>.de'; $m->SMTPAuth=true; $m->Port=587; $m->SMTPSecure='tls';
$m->Username='formular@<rockenstein-domain>'; $m->Password=getenv('SMTP_PASS'); // via Serverumgebung
$m->setFrom('formular@<rockenstein-domain>','Online-Formular'); $m->addAddress('info@notar-beck-erfurt.de');
// Body/Anhang wie in senden.php … $m->send();
```
SMTP-Passwort **nie** in den Code – über die Server-Umgebung (`getenv`) setzen.

## Tipp: NotarNet fragen
NotarNet ist Ihr verschwiegenheitskonformer Notar-IT-Dienstleister. Es lohnt sich,
dort kurz anzufragen, ob es eine fertige Formular-/Webspace-Lösung „aus einer Hand"
gibt – das wäre die rundum sauberste Variante.

## Warum kein US-Formulardienst / kein Jimdo?
- **Jimdo** erlaubt kein PHP/kein FTP – der Endpunkt kann dort nicht laufen.
- **US-Dienste** (formsubmit.co & Co.): Jeder Dienst, der die Daten lesen kann, müsste
  für eine Notarkanzlei zusätzlich zum AVV **in Textform auf die Verschwiegenheit
  (§ 203 StGB) verpflichtet** werden – inkl. seiner Unter-Dienstleister. Der eigene
  Endpunkt auf deutschem Webspace umgeht das, weil gar kein Dritter mitliest.
