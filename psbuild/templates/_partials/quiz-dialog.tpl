{*
 * ODYS Parfums — Quiz (native <dialog>)
 * app.js opens it from any [data-nv-quiz-open] and, on submit, sends the
 * visitor to the collection with the chosen family filter pressed (#fam-…).
 * Occasion and intensity are asked as in the v4 quiz; like there, only the
 * family decides the result today.
 *}
<dialog class="nv-quiz" id="nvQuiz" aria-labelledby="nvQuizTitle">
  <form action="{$odysUrlParfums}" method="get">
    <div class="nv-quiz-hd">
      <div>
        <p class="nv-eyebrow">{l s='3 questions · 30 secondes' d='Shop.Theme.Odys'}</p>
        <h2 class="nv-h2 nv-h2-sm" id="nvQuizTitle">{l s='Trouvez votre ODYS' d='Shop.Theme.Odys'}</h2>
      </div>
      <button type="button" class="nv-quiz-x" data-nv-quiz-close aria-label="{l s='Fermer le quiz' d='Shop.Theme.Odys'}">&times;</button>
    </div>

    <fieldset>
      <legend>{l s='1 · Quelle famille vous attire ?' d='Shop.Theme.Odys'}</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="fam" value="fresh" required/><span>{l s='Frais' d='Shop.Theme.Odys'}<small>{l s='Citrus, aquatique, boisé léger' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="oriental"/><span>{l s='Oriental' d='Shop.Theme.Odys'}<small>{l s='Épicé, ambré, chaud' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="sweet"/><span>{l s='Sucré' d='Shop.Theme.Odys'}<small>{l s='Vanille, caramel, poudré' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="oud"/><span>{l s='Oud' d='Shop.Theme.Odys'}<small>{l s='Bois précieux, fumé, profond' d='Shop.Theme.Odys'}</small></span></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>{l s='2 · Pour quelle occasion ?' d='Shop.Theme.Odys'}</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="occ" value="day"/><span>{l s='Quotidien' d='Shop.Theme.Odys'}<small>{l s='Bureau, sorties' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="occ" value="night"/><span>{l s='Soirée' d='Shop.Theme.Odys'}<small>{l s='Dîner, événement' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="occ" value="gift"/><span>{l s='Cadeau' d='Shop.Theme.Odys'}<small>{l s='Pour offrir' d='Shop.Theme.Odys'}</small></span></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>{l s='3 · Quelle intensité ?' d='Shop.Theme.Odys'}</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="int" value="light"/><span>{l s='Discret' d='Shop.Theme.Odys'}<small>{l s='Proche de la peau' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="int" value="medium"/><span>{l s='Équilibré' d='Shop.Theme.Odys'}<small>{l s='Présent sans s\'imposer' d='Shop.Theme.Odys'}</small></span></label>
        <label class="nv-opt"><input type="radio" name="int" value="strong"/><span>{l s='Affirmé' d='Shop.Theme.Odys'}<small>{l s='Fort sillage' d='Shop.Theme.Odys'}</small></span></label>
      </div>
    </fieldset>

    <div class="nv-quiz-ft">
      <button type="submit" class="nv-btn">{l s='Voir ma sélection' d='Shop.Theme.Odys'} <span class="arw" aria-hidden="true">&rarr;</span></button>
    </div>
  </form>
</dialog>
