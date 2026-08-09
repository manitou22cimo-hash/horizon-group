# Horizon Group

Site web — ménage professionnel pour chalets locatifs et commerces.  
**Baie-Saint-Paul, Québec** · Fondée en **2026**

## Pages

| Fichier | Rôle |
|---------|------|
| `index.html` | Présentation + vidéo pub |
| `services.html` | Services |
| `realisations.html` | Galerie (8 emplacements photo) |
| `contact.html` | Coordonnées |
| `dossier.html` | Formulaire client **public** |
| `dossiers.html` | Espace équipe (code `2026`) |

## Déploiement GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source : **Deploy from a branch**
3. Branch : **`main`** · Folder : **`/ (root)`**
4. **Save**

URL publique :  
`https://manitou22cimo-hash.github.io/horizon-group/`

## Après mise en ligne

1. Dans `dossier.html`, remplacer `contact@horizongroup.ca` par **votre vrai courriel** (FormSubmit).
2. Confirmer le premier envoi FormSubmit (lien dans votre boîte mail).
3. (Optionnel) Ajouter dans `assets/` :
   - `bg-foret-quebec.jpg` — fond
   - `pub-menage-avant-apres.mp4` — vidéo 30 s
   - `realisations/01.jpg` … `08.jpg` — photos galerie

## Structure

```
horizon-group/
├── index.html
├── services.html
├── realisations.html
├── contact.html
├── dossier.html
├── dossiers.html
├── css/styles.css
├── js/app.js
├── assets/
│   ├── bg-foret-quebec.jpg      (optionnel)
│   ├── pub-menage-avant-apres.mp4 (optionnel)
│   └── realisations/01–08.jpg   (optionnel)
└── .nojekyll
```

## Formulaire

Les clients remplissent `dossier.html` en ligne.  
Les fiches partent par **courriel** (FormSubmit) + copie locale navigateur (démo / secours).
