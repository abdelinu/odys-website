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
        <p class="nv-eyebrow">3 questions · 30 secondes</p>
        <h2 class="nv-h2 nv-h2-sm" id="nvQuizTitle">Trouvez votre ODYS</h2>
      </div>
      <button type="button" class="nv-quiz-x" data-nv-quiz-close aria-label="Fermer le quiz">&times;</button>
    </div>

    <fieldset>
      <legend>1 · Quelle famille vous attire ?</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="fam" value="fresh" required/><span>Frais<small>Citrus, aquatique, boisé léger</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="oriental"/><span>Oriental<small>Épicé, ambré, chaud</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="sweet"/><span>Sucré<small>Vanille, caramel, poudré</small></span></label>
        <label class="nv-opt"><input type="radio" name="fam" value="oud"/><span>Oud<small>Bois précieux, fumé, profond</small></span></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>2 · Pour quelle occasion ?</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="occ" value="day"/><span>Quotidien<small>Bureau, sorties</small></span></label>
        <label class="nv-opt"><input type="radio" name="occ" value="night"/><span>Soirée<small>Dîner, événement</small></span></label>
        <label class="nv-opt"><input type="radio" name="occ" value="gift"/><span>Cadeau<small>Pour offrir</small></span></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>3 · Quelle intensité ?</legend>
      <div class="nv-opts">
        <label class="nv-opt"><input type="radio" name="int" value="light"/><span>Discret<small>Proche de la peau</small></span></label>
        <label class="nv-opt"><input type="radio" name="int" value="medium"/><span>Équilibré<small>Présent sans s'imposer</small></span></label>
        <label class="nv-opt"><input type="radio" name="int" value="strong"/><span>Affirmé<small>Fort sillage</small></span></label>
      </div>
    </fieldset>

    <div class="nv-quiz-ft">
      <button type="submit" class="nv-btn">Voir ma sélection <span class="arw" aria-hidden="true">&rarr;</span></button>
    </div>
  </form>
</dialog>
