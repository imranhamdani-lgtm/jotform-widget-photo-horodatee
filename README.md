# Widget JotForm — Photo Horodatée & Géolocalisée

Widget custom JotForm qui capture des photos depuis un mobile et **grave automatiquement** sur chaque image un overlay contenant :
- Date et heure exacte de la capture
- Coordonnées GPS
- Texte de branding configurable

L'overlay est fusionné dans les pixels via Canvas API — il est **inaltérable**, pas un simple overlay CSS.

---

## Déploiement

### 1. GitHub

```bash
git init
git add .
git commit -m "feat: widget photo horodatée v1.0"
git remote add origin https://github.com/VOTRE-ORG/jotform-widget-photo-horodatee.git
git push -u origin main
```

### 2. Cloudflare Pages

1. Dashboard Cloudflare → **Pages** → Create a project
2. Connect to Git → sélectionner le repo
3. Build settings :
   - Framework preset : **None**
   - Build command : *(laisser vide)*
   - Build output directory : `/`
4. Deploy → URL : `https://jotform-widget-photo-horodatee.pages.dev/`

### 3. Intégration JotForm

1. Ouvrir le formulaire dans **JotForm Builder**
2. **Add Element** → rechercher "iFrame" ou "Embed"
3. Coller l'URL : `https://jotform-widget-photo-horodatee.pages.dev/`
4. Dans les propriétés du widget, configurer les **Widget Settings** :

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `maxPhotos` | Texte | `3` | Nombre max de photos (1–10) |
| `brandingText` | Texte | `HARS Analytics — Horodatage certifié` | Texte gravé sur l'image |
| `imageQuality` | Texte | `0.85` | Qualité JPEG (0.5–1.0) |
| `maxWidth` | Texte | `1920` | Largeur max avant compression (px) |
| `requireGPS` | Dropdown | `false` | Rendre le GPS obligatoire |
| `overlayPosition` | Dropdown | `bottom` | Position de l'overlay (`bottom`/`top`) |

---

## Fonctionnement technique

```
Capture photo (input[capture=environment])
    ↓
Chargement dans Image()
    ↓
Redimensionnement sur Canvas (maxWidth)
    ↓
Dessin de l'image originale
    ↓
Gravure de l'overlay (bandeau + texte date/GPS/branding)
    ↓
Export canvas.toDataURL('image/jpeg', quality)
    ↓
Stockage en base64 dans le tableau photos[]
    ↓
JFCustomWidget.sendSubmit({ value: JSON.stringify(photos) })
```

### Format de la valeur envoyée à JotForm

```json
[
  {
    "filename": "photo_1720000000000_1.jpg",
    "base64": "data:image/jpeg;base64,/9j/4AAQ...",
    "timestamp": "2026-04-06T08:30:00.000Z",
    "lat": 43.610769,
    "lon": 3.876716
  }
]
```

---

## Test standalone

Ouvrir `index.html` directement dans un navigateur Chrome en mode mobile (DevTools → Toggle device toolbar).

Le widget détecte l'absence de `JFCustomWidget` et s'initialise avec les valeurs par défaut — les logs sont visibles dans la console.

---

## Notes sur la limite de payload JotForm

JotForm limite les valeurs de widget à ~**10 MB**. Avec les paramètres par défaut :
- Photo 12MP → ~3–4 MB compressée → **3 photos max recommandé**
- Réduire `maxWidth` à `1280` ou `imageQuality` à `0.75` pour alléger

Pour des formulaires avec beaucoup de photos, envisager d'uploader vers un storage externe (Supabase Storage, S3) et n'envoyer que l'URL à JotForm.
