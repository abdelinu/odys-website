# ODYS CRM

A small lead pipeline for the ODYS Parfums shop. It captures the buying intent
the shop otherwise loses and shows it in the Back Office. No third-party
service, no monthly fee, nothing leaves your server.

## Install

1. Copy the `odys_crm` folder into your PrestaShop `modules/` directory.
2. Back Office → **Modules → Module Manager** → search "ODYS CRM" → **Install**.
3. The pipeline appears under **Clients → ODYS CRM**.

Requires PrestaShop 8.0 or newer (tested against the 8.x/9.x module API).

## What it captures

| Source | Trigger | Personal data |
|---|---|---|
| `whatsapp` | any WhatsApp link or button | none (anonymous visitor id) |
| `cart` | add-to-cart buttons | none |
| `quiz` | the home quiz is submitted | none (family, occasion, intensity) |
| `newsletter` | a form with an e-mail field is submitted | the e-mail typed |

Each visitor gets a first-party `odys_vid` cookie (6 months) so repeat visits
join one row instead of creating new ones; `hits` counts the visits. Rows for
the same e-mail, phone or visitor within 30 days are merged while the lead is
still open.

## Pipeline

`Nouveau → Contacté → Commandé → Perdu`

A validated order automatically moves every open lead for that customer to
**Commandé**, with the order id and the amount paid. Everything else is moved
by hand in the Back Office, where you can also keep notes per contact and
export the list to CSV.

## Privacy

- Anonymous events store no name, e-mail or phone — only a random visitor id.
- An e-mail is stored only when the visitor typed it into a form and submitted
  it, which is the consent for that sign-up.
- Uninstalling the module **keeps** the table (`odys_crm_lead`); drop it by
  hand if you want the data gone.
- Under Moroccan law 09-08, tell people in your privacy policy what you keep
  and for how long, and honour access and deletion requests.

## Endpoint

`POST /module/odys_crm/capture` - JSON in, JSON out. It only ever writes; it
never returns stored data to the front office.

| Rule | Behaviour |
|---|---|
| Method | anything but POST -> `405` |
| Body size | over 16 KB -> `413` |
| Malformed JSON | -> `400` |
| Honeypot (`website`) | answered `200`, stored nowhere |
| Rate limit | 40 per IP, 20 per visitor, 600 overall, each per hour -> `429` |
| Validation | an offered e-mail or phone that does not validate -> `422`; a
  request with nothing identifying in it -> `422` |

Every field is cleaned by `OdysCrmGuard` before it reaches the model:

- `source`/`stage`: one of a fixed list, or the fallback - never the caller's string
- `name`, `subject`: tags and control characters stripped, whitespace collapsed
- `email`: `Validate::isEmail()` or nothing
- `phone`: the whole string must look like a number, so `0612345678' OR '1'='1`
  is rejected rather than filtered into a plausible `0612345678 11`
- `visitor`: `[a-z0-9]` only
- `page`: a path on this shop - absolute URLs, `javascript:` and `..` are dropped
- `payload`: re-encoded from decoded scalars, so what is stored is our JSON

The rate limiter counts **requests** in `ps_odys_crm_rate`, not rows in the
lead table: leads are deduplicated, so a bot reusing one visitor id used to
update a single row for ever without the old row-count limit ever tripping.

SQL: PrestaShop's DB layer has no prepared statements. Every value reaches a
query as an `(int)`/`(float)` cast or through `pSQL()`, and `ObjectModel`
escapes each field on the way into the INSERT/UPDATE. Nothing from a request
is concatenated into SQL raw.

Output: the Back Office list escapes the free-text columns, so a row written
by anything other than this endpoint cannot script an employee's browser.

## Tests

The module ships with a harness that stubs the PrestaShop core, so its logic
can be exercised without a shop:

```bash
cd tests
ODYS_MODULE_DIR=.. php run.php newsletter   # also: honeypot dedupe sanitise
ODYS_MODULE_DIR=.. php run.php ratelimit    #       badjson order media admin nulls
ODYS_MODULE_DIR=.. php run.php injection    #       stored paths oversize empty
```

Each case prints the JSON reply, the stored lead and the SQL that was issued.
`mbstring` must be enabled, as PrestaShop itself requires.

## Closing the loop (and why it did not close before)

The leads this site actually produces are anonymous: someone fills a cart and
never types an e-mail. They are keyed by the `odys_vid` cookie. The order hook
used to match a lead only on `id_customer` or `email` — neither of which an
anonymous lead has — so **a cart lead could never be marked won**. It now also
matches on the visitor id, which that same browser still carries at checkout.

A won lead is also filled in at that moment: name, e-mail and the phone number
from the address the customer just confirmed for the delivery. A lead with no
phone teaches nothing and cannot be called back.

## Refusals

Payment on delivery is refused on 15–30% of Moroccan orders, and each refusal
is carriage paid twice. When an order moves to Annulé, Remboursé or Erreur the
lead is noted and put back to *Contacté* — the person is still a customer, this
order simply did not happen. `Odys_Crm::refusals($idCustomer)` counts them from
the order history itself rather than a counter of our own, so it cannot drift
from what the Back Office shows, and the lead list shows a badge before anyone
picks up the phone.

## Campaign attribution by code

`OdysCampaign::attribute()` needs the click cookie, so it only ever credited
visitors who followed the tracked link. A discount code lives its own life: it
is read off a caption, forwarded to a sister, repeated in a comment. Those
orders arrived as though no campaign existed, and every campaign looked weaker
than it was. `attributeByCode()` runs when there is no click to go on and
credits the campaign whose voucher the order actually used.

## The phone as an action

`OdysCrmGuard::phoneE164()` puts a Moroccan mobile into the form `wa.me` wants
and returns empty for anything it cannot read with confidence — the Back Office
then shows the number plainly, with no link. Guessing at an unreadable number
means writing to a stranger.
