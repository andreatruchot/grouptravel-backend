// Importation du module 'dns' intégré à Node.js pour effectuer des requêtes DNS.
const dns = require('dns');

/**
 * Valide le format de l'adresse email fournie.
 * @param {string} email L'adresse email à valider.
 * @returns {boolean} Retourne `true` si l'email est dans un format valide, sinon `false`.
 */

function validateEmailFormat(email) {
  // Expression régulière (regex) pour valider le format de l'email
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   // Teste si l'email correspond au format défini par la regex
  return regex.test(email);
}

/**
 * Vérifie si le domaine de l'adresse email peut recevoir des emails en cherchant ses enregistrements MX.
 * @param {string} email L'adresse email dont le domaine sera vérifié.
 * @returns {Promise<boolean>} Une promesse qui résout en `true` si le domaine peut recevoir des emails, sinon `false`.
 */
function checkDomain(email) {
  // Retourne une promesse pour gérer l'asynchronisme
  return new Promise((resolve, reject) => {
      // Extraction du domaine à partir de l'email (la partie après le '@')
    const domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
       // Résolution DNS pour chercher les enregistrements MX du domaine
      if (err) {
         // En cas d'erreur, la promesse est rejetée
        reject('Erreur lors de la résolution du domaine.');
      } else {
         // Si des enregistrements MX sont trouvés, la promesse est résolue avec `true`
        resolve(addresses && addresses.length > 0);
      }
    });
  });
}

// Exportation des fonctions pour les rendre disponibles à d'autres parties de l'application.
module.exports = { validateEmailFormat, checkDomain };
