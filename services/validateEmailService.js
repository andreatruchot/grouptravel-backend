// Importation du module 'dns' intégré à Node.js pour effectuer des requêtes DNS.
const dns = require('dns');

/**
 * Valide le format de l'adresse email fournie.
 * @param {string} email L'adresse email à valider.
 * @returns {boolean} Retourne `true` si l'email est dans un format valide, sinon `false`.
 * Utilise une expression régulière (regex) pour vérifier le format.
 * La regex vérifie que l'email :
 * - Ne commence pas et ne finit pas par des espaces ou un '@'.
 * - Contient un '@' suivi par au moins un caractère qui n'est pas un espace ou '@',
 *   suivi d'un '.', et ensuite d'autres caractères qui ne sont pas des espaces ou '@'.
 */
function validateEmailFormat(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Vérifie si le domaine de l'adresse email peut recevoir des emails en cherchant ses enregistrements MX.
 * @param {string} email L'adresse email dont le domaine sera vérifié.
 * @returns {Promise<boolean>} Une promesse qui résout en `true` si le domaine peut recevoir des emails, sinon `false`.
 * La fonction extrait d'abord le domaine de l'email en séparant la chaîne sur '@' et en prenant la partie après.
 * Ensuite, elle utilise `dns.resolveMx` pour rechercher les enregistrements MX du domaine.
 * Si la recherche réussit et renvoie au moins un enregistrement MX, la promesse est résolue avec `true`.
 * En cas d'erreur ou si aucun enregistrement MX n'est trouvé, la promesse est rejetée ou résolue avec `false`.
 */
function checkDomain(email) {
  return new Promise((resolve, reject) => {
    const domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        reject('Erreur lors de la résolution du domaine.');
      } else {
        resolve(addresses && addresses.length > 0);
      }
    });
  });
}

// Exportation des fonctions pour les rendre disponibles à d'autres parties de l'application.
module.exports = { validateEmailFormat, checkDomain };
