# Як опублікувати зміну плагіна/агента/скіла

Покроковий чекліст: що робити після редагування чогось усередині
`plugins/<name>/`, щоб зміна (а) з'явилась у маркетплейс-каталозі та на
сайті каталогу, і (б) реально дійшла до тих, хто вже встановив плагін.

Для повного опису правил дивіться [`CONTRIBUTING.md`](../CONTRIBUTING.md),
[`docs/RELEASES.md`](./RELEASES.md), [`docs/PLUGIN-GUIDELINES.md`](./PLUGIN-GUIDELINES.md)
та [`docs/SITE-SPEC.md`](./SITE-SPEC.md) — цей файл лише зводить їх в один
послідовний процес.

## TL;DR

```bash
# 1. Відредагувати файли агента/скіла в plugins/<name>/...

# 2. Підняти версію (автоматично) + запускає локальні перевірки
node scripts/release.mjs <plugin-name> <new-version>

# 3. Дописати запис у CHANGELOG.md (release.mjs сам не робить цей крок)
#    plugins/<plugin-name>/CHANGELOG.md:
#    ## <new-version> — 2026-07-17
#    - опис зміни

# 4. Перевірки
claude plugin validate ./plugins/<plugin-name>
claude plugin validate .
node scripts/validate-marketplace.mjs

# 5. Коміт, PR, merge в main
git add plugins/<plugin-name>
git commit -m "..."
# → відкрити PR → дочекатись зеленого validate.yml → merge

# 6. Тег релізу
git tag <plugin-name>-v<new-version>
git push --tags
```

Сайт каталогу (`site-build.yml` → `pages.yml`) перебудується й задеплоїться
**автоматично** після merge в `main` — нічого руками запускати не треба.

Той, хто вже встановив плагін, отримає оновлення лише після:

```
/plugin marketplace update
/plugin update <plugin-name>@dev-digest-harness-marketplace
```

## Детально, крок за кроком

### 1. Зміни в самому плагіні

Редагуй файли під `plugins/<name>/` — `agents/*.md`, `skills/*/SKILL.md`
тощо. `.claude-plugin/marketplace.json` на цьому кроці **не чіпається**.

### 2. Підняти версію

Версія плагіна живе **лише** в
`plugins/<name>/.claude-plugin/plugin.json` (поле `version`), і ніде
більше — у `marketplace.json` версії немає взагалі. Claude Code визначає
версію в такому порядку: `version` у `plugin.json` → `version` у записі
маркетплейсу → SHA коміту. Тобто **якщо не підняти версію в `plugin.json`,
оновлення тихо не дійде до користувачів**, навіть якщо контент плагіна вже
змінено і замерджено.

SemVer-правила (`docs/RELEASES.md`):
- **patch** (`1.0.1`) — виправлення, правки тексту, без зміни поведінки.
- **minor** (`1.1.0`) — нові скіли/агенти/можливості, зворотно сумісно.
- **major** (`2.0.0`) — breaking change: видалення скіла/агента, зміна
  контракту, перейменування `name`, або major-бамп залежності.

Підняти вручну або через хелпер:

```bash
node scripts/release.mjs <plugin-name> <new-version>
```

Скрипт оновлює `plugin.json`, друкує наступні кроки і одразу запускає
`validate-marketplace.mjs`.

### 3. CHANGELOG

Додай запис угорі `plugins/<name>/CHANGELOG.md` у форматі, який парсить
`scripts/build-index.mjs` (важливо дотримуватись саме цього формату, бо
його читає генератор сайту):

```markdown
## 1.1.0 — 2026-07-17
- Опис зміни.
```

### 4. Коли `marketplace.json` МОЖНА не чіпати

`.claude-plugin/marketplace.json` редагується **тільки** коли:
- додається новий плагін (новий запис у масиві `plugins`), або
- плагін перейменовується/видаляється (через `renames`).

Звичайний бамп версії існуючого плагіна **не потребує** правки цього
файлу — і саме тому такий PR не потребує ревʼю від власника всього
каталогу, лише від власника конкретного плагіна.

### 5. Локальні перевірки перед PR

```bash
claude plugin validate ./plugins/<plugin-name>   # per-plugin
claude plugin validate .                          # каталог у цілому
node scripts/validate-marketplace.mjs              # структурний лінтер
```

Ці самі перевірки (плюс `--strict` для кожного плагіна) запускає CI —
`.github/workflows/validate.yml` — на кожен PR.

### 6. PR → merge → автодеплой сайту

Після merge в `main`, якщо змінювались `plugins/**`,
`scripts/build-index.mjs` або `site/**`, спрацьовує ланцюжок:

1. `.github/workflows/site-build.yml` — перебудовує `site/public/index.json`
   і `site/dist` (перевірочна збірка).
2. `.github/workflows/pages.yml` — запускається після успіху Site Build на
   `main` (або вручну через `workflow_dispatch`), пересобирає сайт і
   деплоїть `site/dist` на GitHub Pages.

Тобто **сайт каталогу оновлюється сам** — вручну запускати збірку не
потрібно. Важливо: сайт читає не `plugins/**` напряму, а згенерований
`site/public/index.json` (його готує `build-index.mjs` з
`marketplace.json` + `plugin.json`/`README.md`/`CHANGELOG.md`/
`SKILL.md`/агентів) — тому без пройденого `site-build.yml` оновлень на
сайті не буде.

### 7. Тег релізу і перевірка залежностей

```bash
git tag <plugin-name>-v<new-version>
git push --tags
```

Якщо піднятий плагін є залежністю іншого (зараз `sdd-engineering`
залежить від інших трьох через діапазон `^1.0.0`), перевір, що новий номер
версії все ще потрапляє в дозволений semver-діапазон залежного плагіна.
Якщо ні — це breaking change і для `sdd-engineering` теж.

### 8. Оновлення там, де плагін вже встановлено

Це два різні, незалежні кроки — виконання одного не тягне інший:

| Команда | Що робить |
| --- | --- |
| `/plugin marketplace update` | Оновлює лише **список** доступних плагінів/версій у каталозі |
| `/plugin update <plugin-name>@dev-digest-harness-marketplace` | Оновлює вже **встановлену** копію плагіна до нової версії |

Тобто щоб конкретна інсталяція реально отримала нову версію, після
`marketplace update` треба ще явно виконати `plugin update` для цього
плагіна.

### 9. Rollback, якщо реліз виявився зламаним

**Не** відкочуй поле `version` у `plugin.json` — версія сама по собі не
каже Claude Code, який коміт качати.

`scripts/rollback.mjs <plugin-name> <sha>` призначений перепінити
`source` плагіна в `marketplace.json` на попередній робочий commit SHA —
але це працює лише для git-based джерел (`github`/`url`/`git-subdir`). У
цьому репозиторії всі плагіни зараз задані локальним відносним шляхом
(`"source": "./plugins/<name>"`), тому для них `rollback.mjs` одразу
відмовить і підкаже зробити `git revert` на сам репозиторій — це і є
фактичний спосіб відкату зараз: `git revert` на комітах з поламаним
релізом (bump версії + зміна контенту), потім новий PR/merge/тег як
завжди.
