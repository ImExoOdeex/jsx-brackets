# jsx-brackets README

This extention automatically adds brackets after writing `=` in JSX. Borrowed from webstorm.

## Features

- Automatically adds brackets after writing `=` in JSX or TSX files
- Automatically removes brackets when you delete the last character of the object

## What it does

Why it could be useful? Many developers use CSS-in-JS libraries to write styles. That means they are using props as styles and to make style prop responsive, often you'll need to use object inside prop. This extension makes it easier, faster and more comfortable to write styles.

| Before                                                            | After                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| <img src="https://cdn.ismcserver.online/Cursor_YGsOKnh5xG.gif" /> | <img src="https://cdn.ismcserver.online/Cursor_sUQm2s0wVo.gif" /> |

This is how it works:

```tsx
export function Header() {
	return (
		<Flex
			justify={"center"}
			direction={} // <--- just when you write `=`
			             // it will add the brackets and move the cursor into the brackets
		/>
			...
		</Flex>
	)
}
```

## For more information

- [Source](https://github.com/ImExoOdeex/jsx-brackets)
- [Support/Contact](https://ismcserver.online/discord)
- https://dreamy-ui.com

**Enjoy!**
