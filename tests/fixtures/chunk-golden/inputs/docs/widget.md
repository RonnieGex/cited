# The widget of Cited

The public chat of the business in the site of its owner: a script the owner pastes once, a button in the corner, and
the chat of the business inside it. `ALLOWED_ORIGINS` decides which sites may carry it.

## 1. The snippet

```html
<script src="https://cited.example/widget.js" async></script>
```

That line is all the owner pastes. The script is a static file of the installation, `public/widget.js`, built from
`lib/widget/script.ts`, and it adds one floating button with the accessible name `Ask us` (or `Pregúntanos` when the
site declares Spanish in `<html lang>`). A click opens `/embed` in an iframe of the same origin as the script, and
`Escape` closes it, from the page that carries the widget and from inside the chat: the document of `/embed` posts the
order to close to its parent, and the widget obeys only a message from its own origin and of that shape
(`lib/widget/messages.ts`). The script does nothing if it is loaded twice and it carries no dependency.

## 2. `ALLOWED_ORIGINS`

The origins that may frame the chat, separated by commas:

```
ALLOWED_ORIGINS=https://shop.example,https://blog.example
```

- Each entry is normalized to its origin: `https://shop.example/checkout?step=2` becomes `https://shop.example`.
- An entry that is not an `http` or `https` origin is dropped, and `*` is not an origin.
- An origin that is not in the list cannot frame the chat: the browser refuses it before the chat loads.
- When the variable is empty the chat may only be framed by the installation itself, which is the safe default.
- The list is read on every request, so changing it does not need a rebuild.

`/api/ask` is not opened by the widget's own list: the iframe is same-origin with the installation, so the question
travels the same door as the public chat, with the same guards, the same limits and the same citations.

## 3. The headers

`/embed` and `/` answer with a `Content-Security-Policy`. The one of `/embed`, with `ALLOWED_ORIGINS` as above:

```
default-src 'self'; script-src 'self' 'nonce-<the nonce of this request>' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'self'; frame-ancestors 'self' https://shop.example https://blog.example
```

and the one of `/`, which nobody frames: the same policy with `frame-ancestors 'self'`.

- `frame-ancestors` is the rule that decides who may embed the chat. It names the installation itself and the origins
  of `ALLOWED_ORIGINS`, and nothing else.
- The nonce belongs to the request: `proxy.ts` builds it and puts it on the request and on the response, so the
  framework scripts of Next carry it and no other inline script may run.
- `style-src` keeps `'unsafe-inline'` because the primary color of the settings travels as an inline style attribute,
  which a nonce does not cover.
- `public/widget.js` is a static file and carries no policy of its own: the site that pastes it decides its own.

## 4. The conversation

Every question carries a `sessionId` of the tab, kept in `sessionStorage` under `cited-session`, so a follow-up inside
the same tab continues the thread and a new tab starts clean. The tab keeps the mark `cited-tab=<id>` in `window.name`
as well, and the id of the storage is believed only when the two agree: a tab opened with `window.open` inherits the
`sessionStorage` of its opener, and not its `window.name`, so it starts a conversation of its own. The id is created
with `crypto.randomUUID()` in the browser: the installation stores no identifier of the visitor beyond the hash of the
address the route already uses.

## 5. The language

The chat opens in the language of the business settings, English when there are none, and the switch `English |
Español` writes the cookie `cited-lang` for a year. The answer comes in the language of the question.

## 6. Building and testing it

```
npm run build:widget
```

writes `public/widget.js` from `lib/widget/script.ts`. The file is committed, it stays under 5 KB, and
`tests/widget.test.ts` fails when the committed file and its source drift apart. The same test loads the script in a
document and proves the button, the iframe of `/embed`, the origin, `Escape` and the language; `e2e/widget.spec.ts`
serves a shop page from an origin of `ALLOWED_ORIGINS` and asks a question through the widget, and proves that an
origin outside the list cannot embed the chat.
