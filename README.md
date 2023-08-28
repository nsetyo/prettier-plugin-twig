## Prettier for Melody

![Prettier Banner](https://raw.githubusercontent.com/prettier/prettier-logo/master/images/prettier-banner-light.png)

---

This Plugin enables Prettier to format `.twig` files, as well as `.html.twig`.

## Install

```bash
npm i -D @nsetyo/prettier-plugin-twig
```

## Use

Add plugin in prettier config (e.g: .prettierrc)

```json
{
	"plugins": ["@nsetyo/prettier-plugin-twig"]
}
```

```bash
prettier --write "**/*.html.twig"
```

### Credit

Most of the code in this plugin is taken from https://github.com/trivago/prettier-plugin-twig-melody,
which seems not maintained anymore. This _fork_ try to fix the issue there and add support for new Twig feature
