// Base email template wrapper
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brendia Pro</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1A1A1A;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1A1A1A;
      padding: 30px 40px;
      text-align: center;
    }
    .header img {
      height: 40px;
    }
    .content {
      padding: 40px;
    }
    .footer {
      background-color: #FDF8F3;
      padding: 30px 40px;
      text-align: center;
      font-size: 14px;
      color: #666666;
    }
    h1 {
      color: #1A1A1A;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px;
    }
    p {
      margin: 0 0 16px;
      color: #333333;
    }
    .button {
      display: inline-block;
      background-color: #B8956A;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #8B7355;
    }
    .highlight {
      background-color: #FDF8F3;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      margin: 0 10px;
      color: #1A1A1A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://brendiapro.hr/images/logo-white.png" alt="Brendia Pro" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Brendia Pro</strong></p>
      <p>Premium Hair Extension Education</p>
      <div class="social-links">
        <a href="https://instagram.com/brendiapro">Instagram</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} Brendia Pro. Sva prava pridrzana.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// Welcome email after registration
export function welcomeEmail(name: string): string {
  return baseTemplate(`
    <h1>Dobro dosli u Brendia Pro!</h1>
    <p>Draga ${name},</p>
    <p>Hvala vam sto ste se pridruzili Brendia Pro obitelji! Uzbudeni smo sto vas mozemo pozdraviti kao novog clana nase zajednice.</p>
    <p>Brendia Pro je vase putovanje prema majstorstvu u tehnici weft ekstenzija. Nasa platforma vam pruza pristup ekskluzivnim video lekcijama, strucnim savjetima i certifikaciji koja ce vas izdvojiti u industriji.</p>
    <div class="highlight">
      <p><strong>Sto mozete ocekivati:</strong></p>
      <ul>
        <li>Visokokvalitetne video lekcije</li>
        <li>Korak-po-korak upute</li>
        <li>Pristup Brendia Pro zajednici</li>
        <li>Mogucnost certificiranja</li>
      </ul>
    </div>
    <a href="https://app.brendiapro.hr/hr/dashboard" class="button">Pristupite platformi</a>
    <p>Ako imate bilo kakvih pitanja, slobodno nas kontaktirajte.</p>
    <p>Srdacan pozdrav,<br>Nikolina i Brendia Pro tim</p>
  `);
}

// Email verification
export function verificationEmail(name: string, verifyUrl: string): string {
  return baseTemplate(`
    <h1>Potvrdite svoju email adresu</h1>
    <p>Draga ${name},</p>
    <p>Hvala vam na registraciji! Molimo vas da potvrdite svoju email adresu klikom na gumb ispod.</p>
    <a href="${verifyUrl}" class="button">Potvrdi email</a>
    <p>Ako niste kreirali racun na Brendia Pro, mozete ignorirati ovaj email.</p>
    <p style="font-size: 12px; color: #666;">Link istjece za 24 sata.</p>
  `);
}

// Password reset
export function passwordResetEmail(name: string, resetUrl: string): string {
  return baseTemplate(`
    <h1>Zahtjev za promjenu lozinke</h1>
    <p>Draga ${name},</p>
    <p>Primili smo zahtjev za promjenu lozinke vaseg Brendia Pro racuna. Kliknite na gumb ispod za postavljanje nove lozinke.</p>
    <a href="${resetUrl}" class="button">Postavi novu lozinku</a>
    <p>Ako niste zatrazili promjenu lozinke, mozete ignorirati ovaj email. Vasa trenutna lozinka ostaje nepromijenjena.</p>
    <p style="font-size: 12px; color: #666;">Link istjece za 1 sat.</p>
  `);
}

// Purchase confirmation
export function purchaseConfirmationEmail(
  name: string,
  courseName: string,
  price: string,
  orderNumber: string
): string {
  return baseTemplate(`
    <h1>Hvala na kupnji!</h1>
    <p>Draga ${name},</p>
    <p>Vasa kupnja je uspjesno zavrsena! Sada imate pristup svim materijalima.</p>
    <div class="highlight">
      <p><strong>Detalji narudzbe:</strong></p>
      <p>Broj narudzbe: ${orderNumber}</p>
      <p>Program: ${courseName}</p>
      <p>Iznos: ${price}</p>
    </div>
    <p>Mozete odmah poceti s ucenjem pristupom nasoj platformi.</p>
    <a href="https://app.brendiapro.hr/hr/dashboard" class="button">Pocni uciti</a>
    <div class="divider"></div>
    <p><strong>Sto slijedi:</strong></p>
    <ul>
      <li>Vas Welcome Box je u pripremi i bit ce vam poslan u najkracemu mogucemu roku</li>
      <li>Pristupite video lekcijama putem nase platforme</li>
      <li>Pridruzite se nasoj zajednici za dodatnu podrsku</li>
    </ul>
    <p>Srdacan pozdrav,<br>Nikolina i Brendia Pro tim</p>
  `);
}

// Certification approved
export function certificationApprovedEmail(
  name: string,
  certificateNumber: string,
  downloadUrl: string
): string {
  return baseTemplate(`
    <h1>Cestitamo na certificiranju!</h1>
    <p>Draga ${name},</p>
    <p>S velikim zadovoljstvom vam javljamo da je vasa prijava za certifikaciju <strong>odobrena</strong>!</p>
    <div class="highlight">
      <p><strong>Vas certifikat:</strong></p>
      <p>Broj certifikata: ${certificateNumber}</p>
      <p>Datum izdavanja: ${new Date().toLocaleDateString("hr-HR")}</p>
    </div>
    <p>Sada ste sluzbeno certificirani Brendia Pro umjetnik! Mozete preuzeti svoj certifikat klikom na gumb ispod.</p>
    <a href="${downloadUrl}" class="button">Preuzmi certifikat</a>
    <p>Zelimo vam puno uspjeha u daljnjem radu!</p>
    <p>Srdacan pozdrav,<br>Nikolina i Brendia Pro tim</p>
  `);
}

// Certification rejected
export function certificationRejectedEmail(name: string, reason: string): string {
  return baseTemplate(`
    <h1>Informacija o prijavi za certifikaciju</h1>
    <p>Draga ${name},</p>
    <p>Pregledali smo vasu prijavu za certifikaciju i nazalost trenutno ne mozemo odobriti vas zahtjev.</p>
    <div class="highlight">
      <p><strong>Razlog:</strong></p>
      <p>${reason}</p>
    </div>
    <p>Molimo vas da pregledate materijale i pokusate ponovno kada budete spremni. Ako imate pitanja, slobodno nas kontaktirajte.</p>
    <a href="https://app.brendiapro.hr/hr/tecaj" class="button">Nastavi ucenje</a>
    <p>Srdacan pozdrav,<br>Nikolina i Brendia Pro tim</p>
  `);
}

// Contact form confirmation
export function contactConfirmationEmail(name: string): string {
  return baseTemplate(`
    <h1>Primili smo vasu poruku</h1>
    <p>Postovani/a ${name},</p>
    <p>Hvala vam sto ste nas kontaktirali! Primili smo vasu poruku i odgovorit cemo vam u najkracemu mogucemu roku.</p>
    <p>Obicno odgovaramo unutar 24-48 sati radnim danima.</p>
    <p>Srdacan pozdrav,<br>Brendia Pro tim</p>
  `);
}

// Admin notification for new contact
export function adminContactNotificationEmail(
  name: string,
  email: string,
  subject: string,
  message: string
): string {
  return baseTemplate(`
    <h1>Nova poruka s kontakt forme</h1>
    <div class="highlight">
      <p><strong>Od:</strong> ${name} (${email})</p>
      <p><strong>Predmet:</strong> ${subject}</p>
    </div>
    <p><strong>Poruka:</strong></p>
    <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 6px;">${message}</p>
    <a href="mailto:${email}?subject=Re: ${subject}" class="button">Odgovori</a>
  `);
}

// Welcome box shipped
export function welcomeBoxShippedEmail(name: string, trackingNumber: string): string {
  return baseTemplate(`
    <h1>Vas Welcome Box je poslan!</h1>
    <p>Draga ${name},</p>
    <p>Uzbudeni smo sto vam mozemo javiti da je vas Brendia Pro Welcome Box upravo poslan!</p>
    <div class="highlight">
      <p><strong>Pracenje posiljke:</strong></p>
      <p>Broj za pracenje: ${trackingNumber}</p>
    </div>
    <p>Ocekivano vrijeme dostave je 3-5 radnih dana.</p>
    <p>U medjuvremenu, mozete poceti s online lekcijama na nasoj platformi.</p>
    <a href="https://app.brendiapro.hr/hr/dashboard" class="button">Nastavi ucenje</a>
    <p>Srdacan pozdrav,<br>Brendia Pro tim</p>
  `);
}

// Enrollment activation magic link
export function enrollmentActivationEmail(
  name: string,
  courseName: string,
  activationUrl: string,
  orderNumber: string
): string {
  return baseTemplate(`
    <h1>Aktivirajte svoj pristup</h1>
    <p>Draga ${name},</p>
    <p>Hvala vam na kupnji! Vasa uplata za <strong>${courseName}</strong> je uspjesno zaprimljena.</p>
    <div class="highlight">
      <p><strong>Broj narudzbe:</strong> ${orderNumber}</p>
    </div>
    <p>Da biste pristupili svom tecaju, potrebno je aktivirati svoj racun. Kliknite na gumb ispod kako biste postavili lozinku i zapoceli s ucenjem.</p>
    <a href="${activationUrl}" class="button">Aktiviraj racun</a>
    <div class="divider"></div>
    <p><strong>Sto ce se dogoditi:</strong></p>
    <ul>
      <li>Postavit cete svoju lozinku</li>
      <li>Automatski cete dobiti pristup svom tecaju</li>
      <li>Mozete odmah poceti s ucenjem</li>
    </ul>
    <p style="font-size: 12px; color: #666;">Link za aktivaciju istjece za 7 dana. Ako link istekne, kontaktirajte nas za novi.</p>
    <div class="divider"></div>
    <p>Srdacan pozdrav,<br>Nikolina i Brendia Pro tim</p>
  `);
}
