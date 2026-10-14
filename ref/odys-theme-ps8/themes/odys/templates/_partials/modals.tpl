{* ODYS – All Modals: Checkout · Account/Loyalty · Notes Panel · Points Toast *}

{* ══ CHECKOUT MODAL ══ *}
{* Deux fenetres de maquette ont ete retirees d'ici :

   - « Mon Compte ODYS » : son formulaire n'authentifiait personne. Il
     acceptait un unique couple ecrit en dur dans le script, et son
     message d'erreur le revelait a qui se trompait. L'inscription, elle,
     ne creait rien : elle annoncait « Bienvenue, +2 points offerts » en
     memoire du navigateur, et le mot de passe saisi n'allait nulle part.

   - « Commander » : un tunnel de commande de maquette, a cote du vrai.

   Aucun bouton ne les ouvrait — elles etaient inatteignables, mais
   livrees sur chaque page, identifiants de demonstration compris, et il
   suffisait d'un data-action="open-account" pour qu'un client y laisse
   son mot de passe. La boutique a ses vraies pages : /connexion,
   /inscription, /mon-compte et son tunnel PrestaShop. *}


{* ══ ACCOUNT / LOYALTY MODAL ══ *}

{* ══ POINTS TOAST ══ *}
<div class="pts-toast" id="ptsToast" role="status" aria-live="polite">
  <span class="pts-toast-star">⭐</span>
  <span id="ptsToastMsg">{l s='+2 points fidélité gagnés !' d='Shop.Theme.Odys'}</span>
</div>

{* ══ OLFACTORY NOTES PANEL ══ *}
<div class="notes-overlay" id="notesOv"></div>
<div class="notes-panel" id="notesPanel" role="dialog" aria-modal="true" aria-label="{l s='Recherche par note olfactive' d='Shop.Theme.Odys'}">
  <div class="np-drag" aria-hidden="true"></div>
  <div class="np-hd">
    <div class="np-hd-pill">
      <span>{l s='Parfums avec la note' d='Shop.Theme.Odys'}</span>
      <span class="np-note-name" id="npNoteName">—</span>
      <span class="np-type" id="npNoteType"></span>
    </div>
    <button class="np-close" data-action="close-notes" aria-label="{l s='Fermer' d='Shop.Theme.Odys'}">✕</button>
  </div>
  <div class="np-body">
    <div class="np-count" id="npCount"></div>
    <div class="np-grid" id="npGrid"></div>
  </div>
</div>
