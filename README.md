# Carte Mondiale avec Données Météorologiques

Ce projet est une application web interactive qui affiche une carte mondiale avec des données météorologiques en temps réel. Les utilisateurs peuvent cliquer sur n'importe quel point de la carte pour obtenir les prévisions météorologiques locales, ou rechercher une ville spécifique pour afficher les informations météorologiques correspondantes.

## Fonctionnalités

- **Carte Interactive** : Utilise la bibliothèque Leaflet pour afficher une carte mondiale interactive.
- **Données Météorologiques** : Récupère les données météorologiques en temps réel via l'API Open-Meteo.
- **Recherche de Ville** : Permet aux utilisateurs de rechercher une ville spécifique pour afficher les prévisions météorologiques.
- **Mode Sombre** : Bascule entre un mode clair et un mode sombre pour une meilleure expérience utilisateur.
- **Gestion du Cache** : Utilise le stockage local pour mettre en cache les données météorologiques et réduire les appels API.
- **Statistiques** : Affiche des statistiques sur les appels API, les temps de réponse, et l'utilisation du cache.

## Technologies Utilisées

- **HTML5** : Structure de la page web.
- **CSS3** : Styles et animations.
- **JavaScript** : Logique de l'application et interactions utilisateur.
- **Leaflet** : Bibliothèque JavaScript pour les cartes interactives.
- **Open-Meteo API** : API pour les données météorologiques.
- **Nominatim** : Service de géocodage pour la recherche de villes.

## Installation

1. Clonez le dépôt GitHub :

   ```bash
   git clone https://github.com/nicorominet/meteo.git
2. Ouvrez le dossier du projet :

   ```bash
   cd votre-repo
3. Ouvrez le fichier index.html dans votre navigateur pour lancer l'application.

## Utilisation
- **Carte Interactive** : Cliquez sur n'importe quel point de la carte pour afficher les prévisions météorologiques locales.
- **Recherche de Ville** : Utilisez la barre de recherche dans le menu hamburger pour rechercher une ville spécifique.
- **Mode Sombre** : Activez ou désactivez le mode sombre en cliquant sur le bouton correspondant dans le menu hamburger.
- **Statistiques** : Affichez les statistiques des appels API en cliquant sur le bouton "Afficher les statistiques" dans le menu hamburger.

## Structure des Fichiers
- index.html : Fichier principal HTML contenant la structure de la page.
- styles.css : Fichier CSS contenant les styles et les animations.
- scripts.js : Fichier JavaScript contenant la logique de l'application.
- cities.js : Fichier JavaScript contenant la liste des villes et leurs coordonnées.

## Contribuer
Les contributions sont les bienvenues ! 

## Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Auteur
Nicolas Silvestre - https://github.com/nicorominet/

## Remerciements
- **Leaflet** pour la bibliothèque de cartes interactives.
- **Open-Meteo** pour l'API météorologique.
- **Nominatim** pour le service de géocodage.



